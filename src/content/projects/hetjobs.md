---
title: "Humbling lessons learned in HPC #1"
date: "2026-05-16"
description: "Hetjobs on CPU-GPU mixed supercomputers"
author: "Blanka Balogh"
tags:
  - "HPC"
  - "Python"
  - "Fortran"
  - "hetjobs"
---

The last part of my PhD was dedicated to the development of a data-driven deep convection parameterization for the Fortran-based ARPEGE-Climat, using a simple neural network (NN). This was meant to be a proof-of-concept experiment. Once the NN was trained offline, the online inference of the NN was hard-coded using Fortran routines: read the weights and biases from netCDF files, recompose the NN inference using matrix operations and use the NN output for deep convection. 

Since then, I now use the ARP-GEM atmosphere model (an optimized version of ARPEGE-Climat with SotA physical parameterizations and designed for km-scale global climate simulations). I no longer use the hard-coded NN inference in Fortran, but rather MPI-based Python/Fortran interfaces: namely, [(py)OASIS](https://oasis.cerfacs.fr/en/home/) or [PhyDLL](https://phydll.readthedocs.io/en/latest/), two couplers developed by Cerfacs. I'll comment later in another blog post about the choice of the method. 

As coding the NN inference in Python allowed us to use much more complex NNs than simple MLP, LSTM or 1D CNNs, their efficient execution needed to be executed on GPUs. The issue we had is that ARP-GEM runs on CPU nodes and is not ported (yet?) to GPUs. This led us to the use of **heterogeneous slurm jobs**, a new world that is not fully supported yet and which turned out to be a complex topic depending on the supercomputer, the compilers we have used to compile the Fortran model, etc. Here, I wanted to describe here what we are able to do, the bad surprises and the issues that are still challenging us (and are currently under investigation). 

Below, a list of our failures after 2+ years working on the topic (not full time fortunately).

# Slurm hetjobs
Slurm hetjobs are used when you need two different partitions to run your slurm applications. Here is an example of a simple hetjob:
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
The launches the execution of `example.exe` and `example.py` on a CPU and a GPU node, respectively. For example, `example.exe` can be a Fortran-based model (like ARP-GEM) and `example.py` the inference of a NN. Please note that your HPC cluster needs to have several different partitions *connected to the same network* to be able to run heterogeneous slurm jobs (hetjobs).

# Running hetjobs: `mpiexec` vs. `srun`
The example above executed a single task on a CPU and a GPU node, using `srun`. ARP-GEM is usually executed using `mpiexec.hydra` (with intelMPI/2018.XX.XX). Depending on your MPI environment and the MPI compiler used, it is also possible to execute a job on heterogeneous partitions using `mpiexec` by creating a custom `hostfile` explicitly listing the name of the nodes used by each process:
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
module load intelmpi/20XX.XX.XX

source MPI_env.1

mpiexec.hydra --print-rank-map --machinefile hostfile -np 1 example.exe : -np 1 python3 -u example.py
```
We were able to run hetjobs using the following MPI environment variables, more specifically:
```
export I_MPI_HYDRA_BOOTSTRAP=ssh   # instead of "slurm"
```

Using `I_MPI_HYDRA_BOOTSTRAP=slurm` triggers the following error:
```
srun: error: Only allocated 1 nodes asked for 2
```
Indeed, in the hetjob configuration described above, `${#NODES[@]}` is equivalent to the number of nodes in `het_group=0` instead of the total number of nodes. 

However, using `intelmpi/2018.XX.XX`, in both cases, we encountered the following issues, that we were still not able to solve: 
- Using `mpiexec.hydra`, if there were more than 1 CPU nodes used (plus 1 GPU node), the application froze. 
- Using `srun`, if there was more than 1 CPU node requested (plus 1 GPU node on `het-group=1`), the export of the global number of nodes was equal to the number of nodes in `het_group=0`. This triggered the following error: 
```
Asked for 3 nodes, available 2.
```

A solution could be to upgrade the intel compilers we use, but this required to port the Fortran model to another supercomputer. 

# Bad surprise: InfiniBand connectivity between CPU and GPU nodes
On the second supercomputer, the Fortran model was ported and compiled using the intel/2023.XX.XX and intelmpi/2021.XX.XX. But we failed when running hetjobs using the version of ARP-GEM compiled with these environment variables. Later, we had the confirmation that hetjobs are not supported using this version of intel/intelmpi, and we need to use at least the version 2024. Since we use the parallel netcdf library, which is not yet available for versions of intel after 2023, we were not able to update the configuration. 

Rather, we compiled the Fortran application with intel/2023 and the openmpi library. We were able to run a ping-pong test between CPU and GPU nodes. However, the large Fortran model execution failed on these partitions, because of a mystery timelimit error. Finally, we identified the problem: the CPU and GPU nodes are not connected to the same InfiniBand subnet on this supercomputer, and it is impossible to connect them to the same network. Using tcp-ip connection, the bandwidth is too narrow to allow the use of MPI between CPU and GPU nodes, as it has been designed for slurm initialization only. 

# Configurations that works
For the moment, we have several configurations running: 
- jobs on one or several GPUs (tested up to a node of 4 V100s + 128 CPUs, A100 GPUs, etc.). This setup is what we are currently using for most test cases. 
- for larger jobs, we still use a hetjob, with 1 CPU node and 1 GPU node. Think of higher resolution simulations after the smaller tests run on a single GPU. 

# Ongoing work
The next move is to change the supercomputer again. But fortunately, we have a version of ARP-GEM running on a single GPU or a single GPU node at a reasonable resolution, using the CPUs of the GPU nodes. We will also port the Fortran model to GH200 nodes (we are lucky enough to have compute hours on GH200), but this will require additional work due to different filesystems used (x86 to ARM) + intel is not available at all on the GH200 nodes we could use. 

Also, currently, we did not find a way to run 2 applications on the same heterogeneous partition. We are interested in this issue in particular, because we use an I/O server to write our outputs, but we only use a few CPUs to run the I/O server, the reservation of an entire CPU node is not necessary.

# Toy models