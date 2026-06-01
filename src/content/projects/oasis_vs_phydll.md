---
title: "PhyDLL vs. (py)OASIS"
date: "2026-05-16"
description: "A comparison between two coupling tools"
author: "Blanka Balogh"
tags:
  - "HPC"
  - "Python"
  - "Fortran"
  - "couplers"
  - "oasis"
  - "phydll"
---

As announced in [my previous blog post](https://blankabalogh.github.io/posts/hetjobs/), you will find here a comparison between two coupling tools that we have tested in [ARP-GEM](https://journals.ametsoc.org/view/journals/clim/38/18/JCLI-D-24-0547.1.xml), namely, ARP-GEM and OASIS. A small comparison between the coupling tools. 

# PhyDLL
[PhyDLL](https://phydll.readthedocs.io/en/latest/) is a lightweight open-source coupling tool developed by Cerfacs, described in [Serhani et al., 2024](REFERENCE). It offers an MPI-based coupling between two components, written either in Fortran, C/C++ or Python. The core routines are written in C++, and it is connected to Fortran using the iso-c binding, and to Python via Cython. The python interface corresponds to a Python package that can be installed from the git repository of the coupler. The benchmarking experiments showed an excellent execution speed. Additionally, PhyDLL natively handles the distribution of halos. 

PhyDLL comes with an easy installation process described on the official website. There is also a general toy application that demonstrated various coupling processes. This is a really important point, because you might want to test first the coupling on a reduced complexity configuration model, before full deployment. There is also a PhyDLL community meeting that is held 4 times a year, where users can exchange with the developers and keeps them updated about their use of PhyDLL.

# OASIS
Another coupling tool developed by the Cerfacs is OASIS3-MCT (currently OASIS3-MCT6) and its Python interface, pyoasis. The OASIS coupler is already widely used in the climate modeling community, but differently. OASIS is principally used in coupled climate models to handle interpolations and field exchanges between several models of the climate system, e.g., an ocean model, a sea ice model and the atmosphere component. So if you are interested in climate modeling and you have one of these large Fortran-based models, chances are that you are already using OASIS without noticing. OASIS is a robust coupling tool. 

Like PhyDLL, OASIS' Python/Fortran interface also relies on a core that is written in C++, and it also comes with a series of comprehensive test cases. It is also very easy to install. 

# The main differences
After describing these two coupling tools, both of which were developed by Cerfacs, you might wonder why not choosing one of the couplers and developing only one of them. There are notable differences between both coupling tools. 

First, the target is not the same. You might prefer to use PhyDLL for prototyping, if you have two components that you would like to couple, or if you are looking for a featherweight coupling tool. OASIS was designed for climate model components coupling, so it might scale better for larger models, with 2+ components to couple. 

Second, the interpolation library is different between PhyDLL and OASIS. OASIS3-MCT6 uses the YAK library, whereas PhyDLL uses CWIPI, an interpolation scheme developed by Cerfacs. Please note that the use of the YAK library was a major update from OASIS3-MCT5 to OASIS3-MCT6. Another technical difference is that it is possible to force manually the CPU partition used during coupling with OASIS, but this is not the case with PhyDLL, where the choice is automated. The available partitions are detailed in the OASIS users' guide. 

Finally, the communities can also be very different. To my knowledge, OASIS is only used in the context of climate modeling, whereas PhyDLL is more general purpose. For the moment, I also get the impression that PhyDLL is more collaborative and less robust than OASIS, with a first version that can be used. 

# Test in ARP-GEM
In ARP-GEM, we have tested both solutions. Here is what we thought about them. 
1. We started with PhyDLL, that was recommended by one of my PhD committee members when we first started doing online tests. I did not make the deployment, however, I did the update from v0 to v1, and I would not say that it was technically really challenging (nor the compilation of ARP-GEM with PhyDLL). 

2. A couple of months later, we discovered that OASIS also has a Fortran/Python interface. Plus, as I have explained it above, OASIS is widely used in climate modeling, so ARP-GEM was already compiled with OASIS. The only thing we needed was deployment. 

3. Then, we ran into one of the limitations of PhyDLL: our coupling involved 3 members in the MPI communication. With PhyDLL, the initialization of `MPI_COMM_WORLD` was done by PhyDLL. At this time, there were no other options: PhyDLL then splitted the communicator and sent it back to both components. In our specific case, our third member, namely, the I/O server XIOS, also made the comm split operation. So it would have required modifications in XIOS (that is not an easy thing to do) or substantial modifications in PhyDLL to add the possibility to enable MPI communications between N members (this might be included in future versions of PhyDLL). So, we switched to OASIS for the Python/Fortran interfacing, because OASIS is already interfaced with XIOS. 

4. Lastly, we encountered the hetjob issue when we wanted to use more than 1 CPU node and a single GPU node. This was something we successfully did a couple of times using PhyDLL, in a configuration without XIOS (in this case, the outputs were not written in netCDF, but in another file format that needed to be converted + this was done on the same partition than the atmosphere model run). So, we thought that the issue was due to OASIS rather than hetjobs -- but tests using toy models demonstrated that the issue was a more general MPI issue (see previous blog post). 

5. Finally, we are left with a version of ARP-GEM with PhyDLL, and another one with OASIS. 

# Which one is faster?
Although we did not perform any proper profiling using both tools, the monitoring of overall execution speed makes us believe that both interface is fast enough -- or at least, there is no notable difference in performance. This is consistent, because both PhyDLL and OASIS relies on the same methodology. 

# To sum up
Either tool is fine, but you might have a preference depending on your application:
1. If you work with very large scale geophysical models, such as ARP-GEM or the ocean model Nemo, there are chances that your model is already compiled with the OASIS coupler. If this is the case, maybe you can stick to it, and maybe there are people in your team who already know how to use OASIS, and can help you getting started. Local knowledge on specific but complex tools is very valuable. 
2. If you have several components that you need to execute using a single mpiexec command, it depends on the tools. OASIS is well interfaced with XIOS, but if you use XIOS, your model is probably already compiled with OASIS. 
3. If you only have a single component and that you would like to get started, or if your application is not as big as a full atmosphere model, I would probably start with PhyDLL. The code is smaller and can be read easier if needed. Also, I would join PhyDLL meetings to learn more about the tool. 

I still have a version of ARP-GEM using both coupling methods. Even though I think that the best solution is probably OASIS in our case, I really appreciate the PhyDLL community. 
