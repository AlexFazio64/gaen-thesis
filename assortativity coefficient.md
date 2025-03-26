# Network analysis

Here we will discuss some basic network analysis metrics.

## Assortativity Coefficient

The Assortativity Coefficient, denoted by `r`, is a measure of the similarity between connections in a network. It ranges from -1 to 1. A positive assortativity coefficient indicates that nodes tend to link to other nodes with the same or similar degree, while a negative coefficient indicates that nodes tend to link to nodes with differing degrees. A coefficient close to 0 indicates a lack of correlation.

$$
	r = \frac{M^{-1}\sum_i{j_ik_i}-[M^{-1}\sum_i{\frac{1}{2}j_ik_i}]^2}{M^{-1}\sum_i{\frac{1}{2}(j_i^2k_i^2)}-[M^{-1}\sum_i{\frac{1}{2}j_ik_i}]^2}
$$

where $j_i$ and $k_i$ are the degrees of the two nodes at the ends of edge $i$, and $M$ is the number of edges in the network.

The paper [Assortative Mixing in Networks](https://journals.aps.org/prl/pdf/10.1103/PhysRevLett.89.208701?casa_token=71SGpQk7KG8AAAAA%3AARTHqgrk8AzR5UE4-SwlAogKC9UQxa3ige-tZLalrN2Klg8zti25M_acfLYAufzKbR96cg2ReyI5cGs) by M. E. J. Newman discusses the assortativity coefficient in more detail.

## Discrete Assortativity Mixing

The Discrete Assortativity Mixing is a simplified version of the assortativity coefficient that is easier to calculate. It is defined as:

$$
	r = \frac{\sum_{i=1} e_{ii} - \sum_{i=1} a_i b_i}{1 - \sum_{i=1} a_i b_i}
$$

where $e_{ii}$ is the fraction of edges that connect nodes of type $i$ to nodes of type $j$, and $a_i$ and $b_i$ are the fractions of the ends of edges that are attached to nodes of type $i$.
