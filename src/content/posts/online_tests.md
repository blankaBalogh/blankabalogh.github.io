---
title: "Offline vs. online tests in hybrid physics/ML systems: two examples"
date: "2026-06-08"
description: "Improved offline score does not necessarily translate into imrpoved online score."
author: "Blanka Balogh"
tags:
  - "HPC"
  - "Python"
  - "Fortran"
  - "couplers"
  - "oasis"
  - "ARPGEM"
  - "model_evaluation"
---
Does better offline performance guarantee better online performance in hybrid modeling ? 
Offline performance of a model corresponds to the model’s performance evaluated agains a held-out dataset that we already have. Typically, the "test" step in NN model development, using an independent data sample, is offline evaluation. 
On the other hand, in hybrid modeling, « online » performance of a model can be evaluated when the NN component is coupled to the physical model components. When developing data-driven parameterizations, online performance typically refers to model performance when the NN component is plugged into the model, as a replacement of the physical parameterization. 
The question that we would like to tackle here is: if model A has better offline performance than model B, does this also mean that model A will be better online than model B? In our experience, the answer is: not necessarily. 
Here, I wanted to share with you two counter-intuitive results: a model with better offline performance is not necessarily the model with the better online performance. The first focuses on a data-driven deep convection model, the second on a surface ocean model that forces an atmosphere model. 

# Data-driven deep convection
The results presented in the following section are from my wonderful intern Hugo from last year. The preprint of his paper is available on [arxiv](https://arxiv.org/abs/2511.05074) (and hopefully soon as an accepted paper).
In this work, two NNs are compared. Both were trained to predict tendencies at the next timestep and they share the same model architecture. They were trained using the same datase, but with different strategies:

- Model 1: "Straightforward" NN, trained directly on a randomly subsampled dataset.
- Model 2: Triggered NN, trained on a balanced dataset and used with a triggering mechanism:
	- A classifier first determines whether deep convection is active within a grid cell.
	- A second NN performs the regression task to predict tendencies only when convection is active.
During the offline evaluation, the straightforward NN achieved lower overall RMSE on zonal means compared to the triggered architecture (see figure below). If we had stopped there, we might have concluded it was the better model.
![Zonal mean moistening tendencies (1-year average). Left: "straightforward" NN, right: triggered NN.](/images/offline_rmse_G26.png)

However, when we implemented the data-driven parameterization inside the full model, the outcome was dramatically different. Despite its lower RMSE, the "straightforward" NN never produced exact zeros when deep convection was not active. This introduced a persistent background "convection noise", that was physically not consistent. 
Once coupled online, this small bias, was amplified through physical interactions, especially in the upper troposphere and at high latitudes. After only a few simulated days, it led to significant overestimation of high cloud cover (top line, Figure below) and large errors aloft. It also triggered large biases on an important quantity in climate modeling, the outgoing longwave radiation (OLR, bottom row in the Figure below). The OLR is the longwave radiation emitted at the top of the atmosphere, which can determine the intensity of Earth's warming (or cooling). 
In contrast, the triggered NN remained stable and physically "consistent". The convection detection step prevented spurious activity, and the simulation ran accurately.
![Bias between simulations using the "straightforward" NN (left column) or the triggered NN (right column), over a 5-year period, and a simulation with the emulated physical parameterization. Top row: high cloud cover, bottom row: outgoing longwave radiation (TOA OLR).](/images/online_bias.png)

If you are interested further in this case study, please read the full paper (https://arxiv.org/abs/2511.05074).

# Data-driven ocean model forcing a physical model
In the second example, we have designed a data-driven surface ocean model. In atmosphere simulations, one of the boundary conditions needed by the model are ocean forcings, especially sea surface temperature (SST) and sea ice concentration (SIC). We made a small data-driven model that outputs SST and SIC values. We trained several models: a Graph Neural Network and a GraphTransformer, both of which operates on a coarse grid (ECMWF’s o96 grid) and that was trained on ERA-5 data, using [anemoi](https://www.ecmwf.int/en/about/media-centre/news/2024/anemoi-new-framework-weather-forecasting-based-machine-learning). 
The model was used to make 1-year rollouts, with a timestep of 1 day. The data-driven SST+SIC model output was then used to force an atmosphere model. 
Regarding offline score, the optimized GraphTransformer resulted in the best offline scores. However, after the lesson learned on deep convection, we also give the GNN a chance. And again, the model with "worse" offline performance did better online. Indeed, the GraphTransformer learned a uniform cold bias of approx. -0.5 degrees, that ultimately resulted in larger online biases. 
![alt text](/images/gnn_sst.png)


# Lessons learned
Offline metrics like RMSE do not fully capture how a model will behave once coupled into a dynamical system. In hybrid modeling, components interact, adjust, and amplify each other’s errors. A model that looks optimal offline can destabilize the system online, while a slightly worse offline performer may be far more robust in practice. This is also why e.g., having fully differentiable models matter: learning or correcting data-driven components online directly becomes easily feasible. 

Online performance cannot be reliably inferred from offline scores alone. In our experience, metrics that allow us to assess whether the model successfully respects physical constraints (that are domain specific), could be the most important thing to consider. 


