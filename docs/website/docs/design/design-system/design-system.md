---
id: designSystem
title: Design System
slug: /design/design-system
---

The Design System is built around defined principles and purposes, which guide decisions on the constructed anatomy of assets, processes and documentation. In this documentation you will find the concepts and guidelines to understand and use it.

## Principles

1. **Easy to use**  
   Make it easy for newcomers to directly use our system to scale the projects. The usage extends to be easy to change and experiment with, allowing designers to identify needs to evolve the tools and be able to quickly make changes.

2. **Keep it simple with low dependencies**  
   Our system opens the door to a wide range of possibilities focusing on the small surface areas needed to cover the most common use cases. This small footprint helps keep it simple with low or zero dependencies.

3. **Flexibility, not rigidity**  
   When building a multi-branding design system we have a trade-off of complexity and flexibility. At our decisions we take the vision of building a system that designers can build something more standard or to explore a new approach. By defaulting to simple while allowing for more complicated builds, the system optimizes for efficiency and ensures that designers don’t feel the need to leave the system for creativity productions.

## Purposes

- Have a Single Source of Truth
- Remove silos and empower teams to work together effectively
- Allow to quickly test products
- Improve consistency
- Deal with several products and brands that have very different styles

## Structure

To minimize complexity and allow flexibility of use, the Design System is broken into elements that have an inside-out flow organized into a hierarchy of layers and - each element builds on the next - making it very practical. Designers can work very fast, and less flexible, at outer layers, using ready-to-use interface components. On the other hand, at inner layers Designers can work with more flexibility by creating new branding elements, design tokens, components and interface funcionalities to meet specific demands.

### Digital Brand

The goal of the Layer Digital Brand is to define a subset of the organization's brand to be used in the design and development of digital interfaces.  
Clarify and focus brand guidelines in specific ways to digital interface work, its innermost core, captures those distinctions and the reasoning and principles behind the brand. This may include basics like logo, color, and photography styles, or even more details, like a point of view on animation.  
For example, an organization might determine that only a subset of the colors permitted for the brand as a whole should be used in digital products. Or maybe there are special typefaces to be used in digital interface design.

### Design Tokens

The goal of the Design Tokens is to take the design concepts expressed in the Layer Digital Brand and codify them for use in constructing digital interfaces. Those design concepts are given a name and a value and sometimes other attributes such as a role or state. Once tokens have been defined, they can be translated into formats for use with multiple platforms. This is the power of tokens—you have one place to manage design decisions and the ability to use those defined values wherever people using the design system need them. Once a brand element has been tokenized, it’s much easier to perpetuate change throughout the system and resulting interfaces.

### UI Components

UI Components are the building blocks of the interface, such as buttons, forms
or tooltips. Each component is built using semantic design tokens so that they
can adapt to different themes without redefining their styles.

### UI Modules

UI Modules combine multiple components to deliver higher level features.
Examples include navigation bars, dashboards or data tables. Modules leverage
the same components and tokens to ensure consistency across applications.
