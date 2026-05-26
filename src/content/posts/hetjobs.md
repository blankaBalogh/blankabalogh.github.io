---
title: "Humbling lessons learned in HPC #1: hetjobs on CPU-GPU mixed supercomputers"
date: "2026-05-16"
description: "Hetjobs on CPU-GPU mixed supercomputers"
author: "Blanka Balogh"
tags:
  - "HPC"
  - "Python"
  - "Fortran"
  - "hetjobs"
---

The last part of my PhD was dedicated to the development of a data-driven deep convection parameterization for the Fortran-based ARPEGE-Climat, using a simple neural network (NN). This was meant to be a proof-of-concept experiment. Once the NN was trained offline, the online inference of the NN was hard-coded using Fortran routines: read the weights and biases from netCDF files, recompose the NN inference using matrix operations and use the NN output for deep convection. All this was done using CPU nodes, but we made major updates to our NN implementation in Fortran.

Since then, I now use the ARP-GEM atmosphere model (an optimized version of ARPEGE-Climat with state-of-the-art physical parameterizations and designed for km-scale global climate simulations). I no longer use the hard-coded NN inference in Fortran, but rather MPI-based Python/Fortran interfaces: namely, [(py)OASIS](https://oasis.cerfacs.fr/en/home/) or [PhyDLL](https://phydll.readthedocs.io/en/latest/), two couplers developed by Cerfacs. I'll comment later in another blog post about the choice of the method. 

As coding the NN inference in Python allowed us to use much more complex NNs than simple MLP, LSTM or 1D CNNs, their efficient execution needed to be executed on GPUs. The issue we had is that ARP-GEM runs on CPU nodes and is not ported (yet?) to GPUs. This led us to the use of **heterogeneous slurm jobs**, a new world that is not fully supported yet and which turned out to be a complex topic depending on the supercomputer, the compilers we have used to compile the Fortran model, etc. Here, I wanted to describe what we are able to do, the bad surprises and the issues that are still challenging us (and are currently under investigation). 

Before diving into what went wrong, here's a quick overview of what hetjobs are and how we use them. 

# Slurm hetjobs
Slurm hetjobs are used when you need two different partitions to run your slurm applications. Hetjobs can be especially interesting when using large (Fortran-based) models that are difficult to port to GPUs, but in which it could be interesting to test Python/NN components, that can be executed efficiently on GPUs. Using slurm hetjobs can be useful in this case: thanks to them, the parts of the model that run efficiently on CPU nodes can be executed jointly with other components executed on GPU nodes. 

Here is an example of a simple hetjob:
```
#!/bin/bash
#SBATCH --jobname="test"
#SBATCH --time=00:01:00
#SBATCH --partition=cpu
#SBATCH --ntasks=1
#SBACTH hetjob
#SBATCH --partition=gpu
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1

module load python3/3.10.12

srun --het-group=0 example.exe : --het-group=1 python3 -y example.py
```
This launches the execution of `example.exe` and `example.py` on a CPU and a GPU node, respectively. For example, `example.exe` can be a Fortran-based model (like ARP-GEM), executed on CPU nodes and `example.py` the inference of a NN, running on GPU nodes. It is also possible to run hetjobs on several different CPU partitions. You can also use 2+ partitions for running hetjobs: in this case, you need to define all of the heterogeneous job partitions in the slurm header (separated by several `SBATCH hetjob` instructions). 

Among others, we use this kind of jobs to run our large-scale online tests of NNs in an atmosphere model ARP-GEM (see [previous blog post on this](https://blankabalogh.github.io/posts/hybrid_models/)). ARP-GEM runs on CPU nodes (`het_group=0`), while the NN inference written in Python is executed on GPU nodes (`het_group=1`). The components send the input/output fields between them using an MPI-based Fortran/Python interface. 

Although we have successfully deployed a hetjob setting to run ARP-GEM + a NN, we ran into several limitations, that we have successfully addressed or not (yet).

# Limitations and workarounds

Below, a list of limitations and failures accumulated over 2+ years of (non-full-time) work on this topic

## Running hetjobs: `mpiexec` vs. `srun`
A first limitation we have encountered was linked to the use of `mpiexec.hydra` with intelMPI. As of the beginning of 2026, hetjobs are not well supported. 

The example below executed a single task on a CPU and a GPU node of a HPC cluster (cluster A). A hetjob can be run using ARP-GEM's launcher, `mpiexec.hydra`, by creating a custom `hostfile` explicitly listing the name of the nodes used by each process. An example of such execution is detailed below:
```
#!/bin/bash
#SBATCH --jobname="test"
#SBATCH --time=00:01:00
#SBATCH --partition=cpu
#SBATCH --ntasks=1
#SBATCH hetjob
#SBATCH --partition=gpu
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1

module load python3/3.10.12
module load intelmpi/2018.XX.XX

mpiexec.hydra --print-rank-map --machinefile hostfile -np 1 example.exe : -np 1 python3 -u example.py
```

This did not work with our default HPC settings. However, we have identified the following environment variable, which seemed relevant to enable the execution of hetjobs:
```
I_MPI_HYDRA_BOOTSTRAP=ssh  # or "slurm"
```
We have identified that the most important environment variable seems to be `I_MPI_HYDRA_BOOTSTRAP`, at least when using intelMPI. There are two values that we have tested. 
1. Using `I_MPI_HYDRA_BOOTSTRAP=slurm` triggers the following error (that leads to a timelimit error), when used in a 1 CPU + 1 GPU nodes settings:
```
srun: error: Only allocated 1 nodes asked for 2
```
Indeed, in the hetjob configuration described above, `${#NODES[@]}` is equivalent to the number of nodes in `het-group=0` instead of the total number of nodes. A similar error message is obtained when using more than 1 CPU nodes (e.g., for 2 CPU nodes + 1 GPU node, the error is: `srun: error: Only allocated 2 nodes asked for 3`). We have tried to fix this issue by manually exporting the correct total number of nodes, but this did not work. 

2. Using `I_MPI_HYDRA_BOOTSTRAP=ssh` results in a hetjob that executed in a configuration of 1 CPU node + 1 GPU node. This is the setting  that we are currently using. Using this setting, we are able to run ARP-GEM at horizontal resolutions of 50 km or below. However, when we request additional CPU nodes (>1), the hetjob application becomes unstable: either it freezes until the job reaches a timelimit or it works. We ran successful tests using a reduced complexity model, but it failed using the full atmosphere model. 

It is also possible to run hetjobs using slurm's direct launcher, `srun`, instead of `mpiexec.hydra`. We have also investigated this case using a toy model, but this lead to a "missing file" error during MPI initialization. 

One possibility to solve the issue could be to use other (more recent) versions of `intel` and `intelmpi`. So far, we have used `intelmpi/2018`. But doing so requires to move from the cluster A to another one offering heterogeneous resources on the same cluster. 


## Bad surprise: InfiniBand connectivity between CPU and GPU nodes
Cluster B has `intel/2023` and `intelmpi/2021` compilers available. It also has CPU and GPU nodes that can be accessed on the same cluster. On cluster A, there was an InfiniBand (IB) connectivity between CPU and GPU nodes of the cluster, that enabled efficient message passing between the partitions. I ran a few tests on cluster B. I was able to ping the GPU partition from the CPU node, and vice versa. However, when I ran one of my toy applications to test the connectivity, I encountered a timelimit issue during the MPI initialization. I thought about bandwidth issues. During the ping test, the bandwidth seems to be very low, but not so that the MPI init does not work. 

I checked the networks available on both partitions, and there were two different IB subnets:
```
$ srun --het-group=0 -n 1 ip link show | grep -E "ib|hsn|mlx"   # check network on the CPU partition
$ 4: ib0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 2044 qdisc htb state UP mode DEFAULT group default qlen 256
    link/infiniband ...
5: ib0.XXXX@ib0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 2044 qdisc mq state UP mode DEFAULT group default qlen 256
    link/infiniband ...

$ srun --het-group=1 -n 1 ip link show | grep -E "ib|hsn|mlx"   # check network on the GPU partition
4: ib0: <BROADCAST,MULTICAST> mtu 4092 qdisc prio state DOWN mode DEFAULT group default qlen 256
    link/infiniband ...
5: ib1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 2044 qdisc mq state UP mode DEFAULT group default qlen 256
    link/infiniband ...
6: ib1.XXXX@ib1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 2044 qdisc mq state UP mode DEFAULT group default qlen 256
    link/infiniband ...
```
As you can see, the CPU partition is connected to the IB0 subnet. On the other hand, the GPU nodes are not connected to the IB0 subnet (the status is 'DOWN'), but they are connected to another IB subnet (namely, IB1). 

So, instead of using the IB connectivity, I tried using TCP-IP (although I knew that it would be much slower). But for some reason, I did not succeed in finding an MPI environment configuration where I totally switched off the IB network. 

I asked the support team (they were responsive and cool) if it was possible to turn the IB0 network on cluster B. Ironically, they told me that there are no free ports available to connect the GPU nodes to IB0, too. As for the TCP-IP connectivity, they told me that this network was only used to initialize the slurm jobs, and switched off after. To sum up, there is no IB connectivity between the CPU and GPU partitions, and using TCP-IP instead is not an option either. Although I really love working on cluster B, I needed to switch to another one to run heterogeneous applications. 

Check network connectivity between the heterogeneous partitions before trying to run heterogeneous applications!

# Configurations that work
For the moment, we have several configurations running: 
- jobs on one or several GPUs (tested up to a node of (4 V100s + 128 CPUs), A100 GPUs, etc.). This setup is what we are currently using for most test cases. On a single GPU node with 4 V100s, we are able to run the atmosphere model at 50 km of horizontal resolution and 50 vertical levels and a NN in Python that runs primarily on GPU VRAM.  
- For larger jobs, we still use a hetjob, with 1 CPU node and 1 GPU node. This enables us to unlock extra compute for the execution of the NN especially, and is sufficient to run our experiments at 50 km of horizontal resolution. 

# Ongoing work
The next move is to change the supercomputer again. But fortunately, we have a version of ARP-GEM running on a single GPU or a single GPU node at a reasonable resolution, using the CPUs of the GPU nodes. We will also port the Fortran model to GH200 nodes (we are lucky enough to have compute hours on GH200), but this will require additional work due to different filesystems used (x86 to ARM) + intel is not available at all on the GH200 nodes we could use. 

Also, currently, we did not find a way to run 2 applications on the same heterogeneous partition. We are interested in this issue in particular, because we use an I/O server to write our outputs, but we only use a few CPUs to run the I/O server, the reservation of an entire CPU node is not necessary. If you are working on similar issues and you somehow succeeded in solving one of these issues, please reach out to me, I would be very happy to chat!