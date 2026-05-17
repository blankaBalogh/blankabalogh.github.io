---
title: "Hybrid models of the atmosphere -- best of both worlds?"
date: "2026-05-16"
description: "Hybrid models of the atmosphere"
author: "Blanka Balogh"
tags:
  - "hybrid_models"
  - "Python"
  - "Fortran"
---
A discussion about hybrid models, from definition to perspectives
---

During the last few years, the world of numerical weather prediction was turned 
upside-down with the apparition of *AI-based forecast models*. Following the pionneering 
papers of Dueben and Bauer (2019) and Keisler (2022), it was shown that AI could be 
used efficiently to emulate the ERA5 dataset. A few months later, FourCastNet, GraphCast 
and Pangu Weather were introduced in preprints. The ECMWF quickly took part in the 
development of a fully AI emulator, the AIFS (the second version of which just passed
the operational state). 

All this rapid progress overshadowed hybrid modeling. Before 2022, the efforts in 
using ML in modeling the atmosphere were directed towards reducing the uncertainty 
in climate models: the representation of subgrid-scale processes, via *parameterizations*. 

Physical parameterizations are statistical functions that gives the average effect of 
small-scale processes at the model's resolution. In the case of a climate model, the resolution
is currently between 50-150 km: processes occuring at scales smaller than this needs
to be parameterized. For example, the size of a convective cell is approximately 10 km; 
thus, convective cells need to be parameterized. Physical parameterizations are built
using observations, physical knowledge and output from high-resolution simulations, such
as Large Eddy Simulations (LES), running at sub-kilometric scales. Yet, they are the 
main source of model uncertainty in climate models. 

What can be a learning sample to learn subgrid processes from? It is now possible to
make short simulations using *storm-resolving* global models. The first experiments
focus on a dataset using a *super-parameterized* version of the Community Atmosphere
Model: a model resolving explicitly convection is embedded in each large-scale column
of the host model. Another possibility that becomes more and more feasible is to run 
short