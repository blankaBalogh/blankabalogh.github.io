---
title: "Offline vs. online tests in hybrid physics/ML systems: two examples"
date: "2026-06-08"
description: "Improved offline score does not necessarily translate into imrpoved online score."
author: "Blanka Balogh"
tags:
  - "hybrid_modeling"
  - "Python"
  - "Fortran"
  - "ARPGEM"
  - "model_evaluation"
---
Does better offline performance guarantee better online performance in hybrid modeling?
Offline performance corresponds to a model's performance evaluated against a held-out dataset that we already have. Typically, the "test" step in NN model development, using an independent data sample, is offline evaluation.
On the other hand, in hybrid modeling, "online" performance can be evaluated when the NN component is coupled to the physical model components. When developing data-driven parameterizations, online performance typically refers to model performance when the NN component is plugged into the model, as a replacement for the physical parameterization.
The question we would like to tackle here is: if model A has better offline performance than model B, does this also mean that model A will be better online than model B? In our experience, the answer is: not necessarily.
Here, I wanted to share two counter-intuitive examples illustrating this. The first focuses on a data-driven deep convection model, the second on a surface ocean model that forces an atmosphere model.

# Data-driven deep convection
The results presented in this section are from my wonderful intern Hugo from last year. The preprint of his paper is available on [arxiv](https://arxiv.org/abs/2511.05074) (and hopefully soon as an accepted paper !).
In this work, two NNs are compared. Both were trained to predict tendencies at the next timestep, and they share the same model architecture. They were trained on the same dataset, but with different strategies:

- Model 1: "Straightforward" NN, trained directly on a randomly subsampled dataset.
- Model 2: Triggered NN, trained on a balanced dataset and used with a triggering mechanism:
	- A classifier first determines whether deep convection is active within a grid cell.
	- A second NN performs the regression task to predict tendencies only when convection is active.

During the offline evaluation, the straightforward NN achieved a lower overall RMSE on zonal means than the triggered architecture (see figure below). If we had stopped there, we might have concluded it was the better model.
![Zonal mean moistening tendencies (1-year average). Left: "straightforward" NN, right: triggered NN.](/images/offline_rmse_G26.png)

However, when we implemented the data-driven parameterization inside the full model, the outcome was dramatically different. Despite its lower RMSE, the "straightforward" NN never produced exact zeros when deep convection was not active. This introduced a persistent background "convection noise" that was physically inconsistent.
Once implemented online, this small bias was amplified through physical interactions, especially in the upper troposphere and at high latitudes. After only a few simulated days, it led to a significant overestimation of high cloud cover (top row in the figure below) and large errors aloft. It also triggered large biases in an important quantity in climate modeling, the outgoing longwave radiation (OLR, bottom row in the figure below). The OLR is the longwave radiation emitted at the top of the atmosphere, which is used to estimate the intensity of Earth's warming (or cooling).
In contrast, the triggered NN remained stable and physically consistent. The convection detection step prevented spurious activity, and the simulation remained accurate.

![Bias between simulations using the "straightforward" NN (left column) or the triggered NN (right column), over a 5-year period, and a simulation with the emulated physical parameterization. Top row: high cloud cover, bottom row: outgoing longwave radiation (TOA OLR).](/images/online_bias.png)

If you are interested in this case study, please read the [full paper](https://arxiv.org/abs/2511.05074).

# Data-driven ocean model forcing a physical model
Recently, I encountered another example where the best offline score did not translate into the best online performance. We have designed a data-driven surface ocean model. In atmosphere simulations, one of the boundary conditions needed by the model is the ocean surface forcing, especially sea surface temperature (SST) and sea ice concentration (SIC). We built a small data-driven model that outputs SST and SIC values, using atmosphere forcings as inputs. We trained several models: in particular, a Graph Neural Network (GNN) and a GraphTransformer, both of which operate on a coarse grid (ECMWF's o96 grid, approximately 100 km horizontally). The models were trained on daily-averaged ERA5 data using the anemoi framework.

The models were used to make 1-year rollouts (i.e., 365/366 iterative steps), and the data-driven SST+SIC output was then used to force an atmosphere model. In terms of offline scores, the optimized GraphTransformer performed best. However, after the lesson learned on deep convection, we also gave the GNN a chance, despite its overall higher RMSE. And again, the model with "worse" offline performance did better online. Indeed, the GraphTransformer had learned a uniform cold bias of approx. -0.5°C, which ultimately resulted in larger online biases (of course, this kind of bias has consequences for the atmosphere model). The GNN, on the other hand, had larger errors, but in areas that ultimately did not affect the coupled model's performance.

The data-driven ocean modeling part is ongoing work, so I'll save the final results for a later blog post.

# Lessons learned
Offline metrics like RMSE do not fully capture how a model will behave once coupled into a dynamical system. In hybrid modeling, components interact, adjust, and amplify each other's errors. A model that looks optimal offline can destabilize the system online, while a slightly worse offline performer may be far more robust in practice. This is also one reason why having fully differentiable models matters: learning or correcting data-driven components online becomes easily feasible.

Online performance cannot be reliably inferred from offline scores alone. In our experience, metrics that assess whether the model respects physical constraints (which are domain-specific) may be the most important thing to consider.