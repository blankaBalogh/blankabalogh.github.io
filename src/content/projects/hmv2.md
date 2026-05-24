---
title: "Hybrid models of the atmosphere -- best of both worlds?"
date: "2026-05-10"
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
papers of [Dueben and Bauer (2019)](https://gmd.copernicus.org/articles/11/3999/2018/gmd-11-3999-2018.pdf) 
and [Keisler (2022)](https://arxiv.org/abs/2202.07575), it was shown that AI has the potential to 
efficiently to emulate the ERA5 dataset. A few months later, [FourCastNet (FCN)](https://arxiv.org/abs/2202.11214), 
[GraphCast](https://www.science.org/doi/10.1126/science.adi2336) 
and [Pangu Weather](https://www.nature.com/articles/s41586-023-06185-3) 
were introduced in preprints. The ECMWF quickly took part in the 
development of a fully AI emulator, the [AIFS](https://arxiv.org/abs/2406.01465) 
(the second version of which just passed the operational state). There are also efforts 
towards making emulators of (global) climate models, such as [ACE](https://www.nature.com/articles/s41612-025-01090-0).

These emulators hold the promise to revolutinize weather forecasting, by accelerating 
simulations. Physical inconsistencies can be acceptable at a horizon of a couple of days or even weeks. 
However, in climate simulations, their respect is of utmost importance. For example, conservation 
laws, such as energy conservation, should be respected. 

Moreover, rather than *following a state variable as long as possible* and *modelling accurate chronology*, 
the main objective in climate modeling is to represent and understand *distribution shifts*, a task 
AI-based emulators does not excel on. If the learning sample only uses observational 
data, i.e., in present climate, there is no guarantee that the AI model is realiable 
in situations that were not sampled during training. For example, [Sun et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40392853/) 
highlights the fact that the extrapolation capabilities of AI weather models seems to be limited: FCN fails to 
produce category 5 tropical cyclones if they were removed from the learning sample. 
However, a small number of high intensity events seems sufficient to train the AI 
emulator efficiently, and depending on the architecture used, AI emulators successfully 
transfer knowledge from one location to another globally. 

# What is hybrid modeling? 
*Hybrid modeling*, i.e., blending physics-based modeling and AI/ML emulation, is meant to 
address issues with physical coherence, and also interpretability. Hybrid modeling 
can be deployed strategically, typically to improve the representation of uncertain 
processes for which high fidelity data is available or can be collected or generated. 
In the context of climate modeling, think of deep convection. Deep convection is 
small scale clouds, occurring on scales (~10 km) below the horizontal resolution of 
current global climate models (50-100 km), but the effects of which cannot be neglected. 
There are now high resolution (km-scale) simulations that can resolve convection 
explicitly (e.g., the [DYAMOND model intercomparison](https://mpimet.mpg.de/en/communication/news/dyamond-next-generation-climate-models). 

These km-scale global models cannot be run for very long periods of time. But they 
can be used to run simulations long enough to train/fine tune ML emulators with 
the generated data. 

# Why are so few experiments focusing on hybrid modeling? 
There are several reasons behind this. First, the hybrid modeling community turned 
to AI-driven NWP models, which drained most workforce. AI-NWP is a very well defined
problem for AI, because you have everything you need to train these large models: 
a clean, annotated dataset that can easily be downloaded and that is used as the 
reference dataset (ERA-5), GPU power, smart people, interaction with domain scientists. 
In contrast, the objective is less well defined in hybrid modeling: there is no reference
dataset that can be used to train model. 

Also, in hybrid modeling, both the ML and the physical models need to be modified. 
Interfacing very large Fortran-based models (as an example, 
ARPEGE is ~10 millions of lines of Fortran) 
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