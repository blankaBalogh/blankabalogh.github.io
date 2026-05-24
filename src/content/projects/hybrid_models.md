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
upside-down with the emergence of *AI-based forecast models*. Following the pioneering 
papers of [Dueben and Bauer (2019)](https://gmd.copernicus.org/articles/11/3999/2018/gmd-11-3999-2018.pdf) 
and [Keisler (2022)](https://arxiv.org/abs/2202.07575), it was shown that AI has the potential to 
efficiently emulate the ERA5 dataset. A few months later, [FourCastNet (FCN)](https://arxiv.org/abs/2202.11214), 
[GraphCast](https://www.science.org/doi/10.1126/science.adi2336) 
and [Pangu Weather](https://www.nature.com/articles/s41586-023-06185-3) 
were introduced in preprints. The ECMWF quickly took part in the 
development of a fully AI emulator, the [AIFS](https://arxiv.org/abs/2406.01465) 
(the second version of which just passed the operational state). There are also efforts 
towards making emulators of (global) climate models, such as [ACE](https://www.nature.com/articles/s41612-025-01090-0).

These emulators hold the promise to revolutionize weather forecasting, by accelerating 
simulations. Physical inconsistencies can be acceptable at a horizon of a couple of days or even weeks. 
In the case of climate simulations, time scales at stake are much longer, typically ranging from 10 to 100 years. 
Using AI emulators and without specifically enforcing them, there is no guarantee on physical 
coherence of the emulators (e.g., [Subramanian et al., 2025](https://arxiv.org/abs/2506.08285)).
However, for some simulations, such as climate simulations, their respect is of utmost 
importance. For example, conservation laws, such as energy conservation, should be respected. 

Moreover, rather than *following a state variable as long as possible* and *modelling accurate chronology*, 
the main objective in climate modeling is to represent and understand *distribution shifts*, a task 
AI-based emulators do not excel at. If the learning sample only uses observational 
data, i.e., in present climate, there is no guarantee that the AI model is reliable 
in situations that were not sampled during training. For example, [Sun et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40392853/) 
highlights the fact that the extrapolation capabilities of AI weather models seem to be limited: FCN fails to 
produce category 5 tropical cyclones if they were removed from the learning sample. 
However, a small number of high intensity events seems sufficient to train the AI 
emulator efficiently, and depending on the architecture used, AI emulators successfully 
transfer knowledge from one location to another globally. 

A possible way to address these issues is to use *hybrid modeling*, blending physics-based modeling and AI/ML emulation. 
Typically, current *hybrid* models keep large parts of the physical code, while replacing 
strategically some parts of the code with AI/ML emulators. 

# Why are so few experiments focusing on hybrid modeling? 
There are several reasons behind this. First, AI-NWP is a very well defined
problem for AI, because you have everything you need to train these large models: 
a clean, annotated dataset that can easily be downloaded and that is used as the 
reference dataset (ERA-5), GPU power, smart people, interaction with domain scientists. 
In contrast, the objective is less well defined in hybrid modeling: there is no reference
dataset that can be used to train model. The parts of a physical code that can be 
accelerated by AI/ML emulators depend strongly on the objective of the simulation, in 
particular due to uncertainties introduced by the data-driven parts. 

Also, in hybrid modeling, both the ML and the physical models need to be modified. 
Interfacing very large Fortran-based models (ARPEGE is ~10 millions of lines of Fortran) 
with ML can be technically challenging (see other posts on this in the upcoming
weeks or months). Also, current atmosphere models are written in Fortran or C/C++, 
and they are not automatically differentiable: the interactions between the ML
component and the physical model are difficult to tune (online). During the past few 
years, a growing number of solutions exist to call NN inference from within a Fortran code 
(e.g., [FTorch](https://github.com/Cambridge-ICCS/FTorch)) or to interface a Fortran code 
with a Python component (e.g., [PhyDLL](https://phydll.readthedocs.io/en/latest/) or 
[the OASIS coupler](https://oasis.cerfacs.fr/en/home/) -- this latter is mostly used 
in geophysical models). Especially in the case of atmosphere modeling, where large 
legacy codes are just being adapted for GPUs, the use of heterogeneous high performance computing (HPC) components (i.e., 
CPU nodes to execute the Fortran code + GPU nodes for efficient NN execution) can also 
be challenging. I save discussions on the use of heterogeneous HPC resources and Fortran/Python 
interfaces for specific posts.  

Lastly, hybrid modeling can inherently be difficult because of the way physical 
models are designed. Typically, there is one parameterization per small scale process. 
However, in high resolution simulations, the separation between processes is not 
well defined. Learning a single process, like, deep convection, becomes difficult 
when using a km-scale simulation, because the contribution of convection also needs
to be computed to define a learning sample. 

Despite these challenges, hybrid modeling remains a compelling research direction.

# The strengths of hybrid models and open questions
Using hybrid models, we can have the best of both worlds: the robustness and reliability
of physical models, and the power of ML to learn relations from observed data. 
The validity of AI models, trained using solely the ERA-5 dataset, under changing climate conditions is currently far 
from guaranteed. 

Thus, for some problems, the hybrid approach can still be well suited. Climate 
modeling can be one of such approaches. But the bottlenecks described above need
to be addressed first, and most of them are still open questions. 

First, the differentiability of large-scale legacy Fortran codes. If the goal is 
to introduce AI/ML components while keeping large parts of a physical model, having 
a fully differentiable model could be a key. For example, [NeuralGCM](https://www.nature.com/articles/s41586-024-07744-y)
is one of the first examples of a hybrid model built around a fully differentiable 
core written in Python/JAX and a suite of 
parameterization machine-learned using the ERA-5 dataset. This question is all the 
more important given that GPU-based computing is currently advancing rapidly, 
and Fortran-based applications are hard to port to GPUs (especially very large 
code that has been developed for decades). AI tools, like agents, could help domain 
scientists in code modernization. Especially, since the question of the language to 
use to design the codes of the future remains an open question, with several choices: 
Julia, Python/JAX, domain specific languages such as [GT4Py](https://github.com/gridtools/gt4py), etc. 

The other major question to answer in hybrid modeling is which parts of the model 
should be kept physical, and which ones could be replaced by AI/ML emulators. The use of 
AI/ML emulators could introduce additional uncertainties and a lack of explainability. Moreover, 
especially using physical models that are not differentiable, and hence making it very 
difficult to tune online AI/ML components, stability issues can arise from the coupling between 
the physical and the AI/ML parts of the model. 

# About the blog
As a scientist working at the intersection of physical simulations, HPC and AI/ML applied 
to climate modeling, I made this blog to share my experience on developing hybrid models. 
In a nutshell, this blog is about everything I will never publish but that seems 
like valuable information for anyone working on hybrid model development: lessons 
learned on HPC, model evaluation, Fortran/Python interfaces, and more.