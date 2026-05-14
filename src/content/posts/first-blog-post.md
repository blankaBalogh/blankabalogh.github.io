---
title: "Humbling lessons learned in HPC #1"
date: "2026-05-14"
description: "Hetjobs on cpu-gpu mixed supercomputers"
author: "Blanka Balogh"
tags:
  - "HPC"
  - "Python"
  - "Fortran"
  - "hetjobs"
---

I've been working with slurm hetjobs for the past 3 years, yet, there are still challenges in using them for large scale jobs, due to several reasons. Here, I wanted to focus on two ways of launching hetjob applications: using `mpiexec.hydra` and `srun`. But first, let's define what a hetjob is and how it works. 

# Slurm hetjobs

# Running hetjobs: using `mpiexec.hydra` vs. `srun`