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

# AI-driven NWP models
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
of the host model. 

Another possibility that becomes more and more feasible is to run short (a few years) 
simulation at kilometer-scale resolution (for example, see the DYAMOND km-scale model 
intercomparison project). These simulations are numerically expensive, but they 
provide an accurate representation of small-scale processes. Data from a short
simulation can be used to train machine learning (ML) emulators to represent small
scale processes, that could be used in coarser-resolution models, and ultimately
provide a more accurate representation of small scale processes. 

# Why are so few experiments focusing on hybrid modeling? 
There are several reasons behind this. First, the hybrid modeling community turned 
to AI-driven NWP models, which drained most workforce. AI-NWP is a very well defined
problem for AI, because you have everything you need to train these large models: 
a clean, annotated dataset that can easily be downloaded and that is used as the 
reference dataset (ERA-5), GPU power, smart people, interaction with domain scientists. 
In contrast, the objective is less well defined in hybrid modeling: there is no reference
dataset that can be used to train model. 

Also, in hybrid modeling, both the ML and the physical models need to be modified. 
Interfacing very large Fortran-based models (ARPEGE is ~10 millions of lines of Fortran) 
with ML can be technically challenging (see other posts on this in the upcoming
weeks or months). Also, current atmosphere models are written in Fortran or C/C++, 
and they are not automatically differentiable: the interactions between the ML
component and the physical model are difficult to tune (online). 

Lastly, hybrid modeling can inherently be difficult because of the way physical 
models are designed. Typically, there is one parameterization per small scale process. 
However, in high resolution simulations, the separation between processes is not 
well defined. Learning a single process, like, deep convection, becomes difficult 
when using a km-scale simulation, because the contribution of convection also needs
to be computed to define a learning sample. 

Why focusing on hybrid modeling, then? 

# The strengths of hybrid models
The use of fully AI-driven models can have limitations. While they seem well suited 
for weather prediction, they can be insufficient for climate modeling. As opposed
to weather forecasting, where the objective is to predict a timeseries where the
chronological order and intensities matter, the objective in climate model is to 
identify *shifts in distribution*, a task AI models generally do not excel at. 

Using hybrid models, we can have the best of both worlds: the robustness and reliability
of physical models, and the power of ML to learn relations from observed data. 
The validity of ML models under changing climate conditions are currently far 
from granted. 

Thus, for some problems, the hybrid approach can still be well suited. Climate 
modeling can be one of such approaches. But the bottlenecks described above needs 
to be addressed first -- at what cost? 

As a scientist working in hybrid modeling, I wanted to give you an outlook of the
problems I am working on, at the intersection of AI/ML, physical modeling and high
performance computing. Stay tuned for new posts!


During the last few years, the world of numerical weather prediction was turned 
upside-down with the emergence of *AI-based forecast models*. Following the pioneering 
papers of Dueben and Bauer (2019) and Keisler (2022), it was shown that AI could be 
used efficiently to emulate the ERA5 dataset. A few months later, FourCastNet, GraphCast 
and Pangu Weather were introduced in preprints. The ECMWF quickly took part in the 
development of a fully AI emulator, the AIFS (the second version of which just passed
the operational state). 

All this rapid progress overshadowed hybrid modeling. Before 2022, the efforts in 
using ML in modeling the atmosphere were directed towards reducing the uncertainty 
in climate models: the representation of subgrid-scale processes, via *parameterizations*. 

Physical parameterizations are statistical functions that give the average effect of 
small-scale processes at the model's resolution. In the case of a climate model, the resolution
is currently between 50-150 km: processes occuring at scales smaller than this needs
to be parameterized. For example, the size of a convective cell is approximately 10 km; 
thus, convective cells need to be parameterized. Physical parameterizations are built
using observations, physical knowledge and output from high-resolution simulations, such
as Large Eddy Simulations (LES), running at sub-kilometric scales. Yet, they are the 
main source of model uncertainty in climate models. 

What can be a training dataset to learn subgrid processes from? It is now possible to
make short simulations using *storm-resolving* global models. The first experiments
focus on a dataset using a *super-parameterized* version of the Community Atmosphere
Model: a model resolving explicitly convection is embedded in each large-scale column
of the host model. Another possibility that becomes more and more feasible is to run 
short