# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 6.2.0 (2025-12-08)

### Features

- enhance selected option styling ([#796](https://github.com/ttoss/ttoss/issues/796)) ([9a740bd](https://github.com/ttoss/ttoss/commit/9a740bd78376852ecd85a020dd7307ea3f7d121e))

# [6.1.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@6.0.4...@ttoss/ui@6.1.0) (2025-12-04)

### Features

- add SpotlightCard component with responsive design and animations ([#776](https://github.com/ttoss/ttoss/issues/776)) ([47d02fd](https://github.com/ttoss/ttoss/commit/47d02fd22f97ab51d6e70f3a24356da047fe45c0))

## [6.0.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@6.0.3...@ttoss/ui@6.0.4) (2025-11-26)

**Note:** Version bump only for package @ttoss/ui

## [6.0.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@6.0.2...@ttoss/ui@6.0.3) (2025-11-26)

### Bug Fixes

- **ui,forms:** Fix ref forwarding for Checkbox and FormField components ([#780](https://github.com/ttoss/ttoss/issues/780)) ([98a10c9](https://github.com/ttoss/ttoss/commit/98a10c9d5c41bafdd1e540409456f9c21dbd0401))

## [6.0.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@6.0.1...@ttoss/ui@6.0.2) (2025-11-24)

**Note:** Version bump only for package @ttoss/ui

## [6.0.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@6.0.0...@ttoss/ui@6.0.1) (2025-11-24)

**Note:** Version bump only for package @ttoss/ui

# [6.0.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.11.1...@ttoss/ui@6.0.0) (2025-11-24)

- Refactor form components to support TooltipIcon and improve documentation (#773) ([248c32a](https://github.com/ttoss/ttoss/commit/248c32a6d1beabda44df3363df9183ec26914cad)), closes [#773](https://github.com/ttoss/ttoss/issues/773)

### BREAKING CHANGES

- FormField component now uses labelTooltip
  instead of tooltip prop. This clarifies that the tooltip
  describes the label/field, distinguishing it from potential
  future tooltips for hints or icons.

Updated components:

- FormField (type definition)
- FormFieldCheckbox, FormFieldRadio, FormFieldRadioCard
- FormFieldRadioCardIcony, FormFieldSelect, FormFieldSwitch
- FormFieldTextarea, Brazil/FormFieldPhone, Brazil/FormFieldCNPJ

* feat(forms): add leadingIcon/trailingIcon support to input components

Add icon support to FormField input components:

- FormFieldInput: supports both leadingIcon and trailingIcon
- FormFieldPassword: supports leadingIcon only
  (trailingIcon reserved for show/hide password toggle)
- FormFieldNumericFormat: supports both icons via customInput
- FormFieldPatternFormat: supports both icons via customInput

Coverage improved: 93.56% statements (+3.97%), 89.14% branches (+6.97%)

- docs(storybook): add TooltipIcon stories and update FormField examples

* Add comprehensive TooltipIcon component stories (12 variants)
* Add leadingIcon/trailingIcon examples to FormFieldInput
* Add leadingIcon example to FormFieldPassword
* Update all Form stories to use labelTooltip prop

- fix: tests

## [5.11.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.11.0...@ttoss/ui@5.11.1) (2025-11-23)

**Note:** Version bump only for package @ttoss/ui

# [5.11.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.8...@ttoss/ui@5.11.0) (2025-11-23)

### Features

- add icon input tooltip ([#767](https://github.com/ttoss/ttoss/issues/767)) ([e86c9da](https://github.com/ttoss/ttoss/commit/e86c9da68d8b09ef57f55305693f923b2291d312))

## [5.10.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.7...@ttoss/ui@5.10.8) (2025-11-22)

**Note:** Version bump only for package @ttoss/ui

## [5.10.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.6...@ttoss/ui@5.10.7) (2025-11-21)

**Note:** Version bump only for package @ttoss/ui

## [5.10.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.5...@ttoss/ui@5.10.6) (2025-11-19)

**Note:** Version bump only for package @ttoss/ui

## [5.10.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.4...@ttoss/ui@5.10.5) (2025-11-17)

### Bug Fixes

- update background color logic for selected radio option ([#748](https://github.com/ttoss/ttoss/issues/748)) ([6cd3dcb](https://github.com/ttoss/ttoss/commit/6cd3dcb5f5b2da45ab202852dff1e38623df24fe))

## [5.10.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.3...@ttoss/ui@5.10.4) (2025-11-11)

**Note:** Version bump only for package @ttoss/ui

## [5.10.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.2...@ttoss/ui@5.10.3) (2025-11-05)

### Bug Fixes

- tests utils and change import to default ([#746](https://github.com/ttoss/ttoss/issues/746)) ([21d71f8](https://github.com/ttoss/ttoss/commit/21d71f877dda1f82e02afe377dac18ef23407866))

## [5.10.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.1...@ttoss/ui@5.10.2) (2025-10-12)

**Note:** Version bump only for package @ttoss/ui

## [5.10.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.10.0...@ttoss/ui@5.10.1) (2025-10-12)

**Note:** Version bump only for package @ttoss/ui

# [5.10.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.9.3...@ttoss/ui@5.10.0) (2025-10-11)

### Features

- fileuploader ([#738](https://github.com/ttoss/ttoss/issues/738)) ([c5eaf6f](https://github.com/ttoss/ttoss/commit/c5eaf6f9d0b0cb5d67fdcef651f55cb63ae86b8d))

## 5.9.3 (2025-10-06)

### Bug Fixes

- cloud auth permissions ([#726](https://github.com/ttoss/ttoss/issues/726)) ([afeee5a](https://github.com/ttoss/ttoss/commit/afeee5a008b4cf0dd70945a1867fc384f17b7b7f))
- switch button ([8ab6b71](https://github.com/ttoss/ttoss/commit/8ab6b71039d8169a2438fa5dd3d3388aca940a5b))

## [5.9.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.9.1...@ttoss/ui@5.9.2) (2025-08-05)

**Note:** Version bump only for package @ttoss/ui

## [5.9.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.9.0...@ttoss/ui@5.9.1) (2025-08-02)

**Note:** Version bump only for package @ttoss/ui

# [5.9.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.8.2...@ttoss/ui@5.9.0) (2025-07-04)

### Features

- docs color tokens ([#625](https://github.com/ttoss/ttoss/issues/625)) ([5826a91](https://github.com/ttoss/ttoss/commit/5826a91292852f69b87dfbce1391230a4f33e752))

## [5.8.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.8.1...@ttoss/ui@5.8.2) (2025-06-20)

**Note:** Version bump only for package @ttoss/ui

## [5.8.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.8.0...@ttoss/ui@5.8.1) (2025-06-13)

### Bug Fixes

- notifications menu new messages ([#700](https://github.com/ttoss/ttoss/issues/700)) ([0a4c5a8](https://github.com/ttoss/ttoss/commit/0a4c5a8c0ed7b54821120f62fe31d3319a398b0a))

# [5.8.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.7.0...@ttoss/ui@5.8.0) (2025-06-11)

### Features

- add input tooltip in formfield component ([#699](https://github.com/ttoss/ttoss/issues/699)) ([59e8726](https://github.com/ttoss/ttoss/commit/59e872619e2aa7ad5f4ed2be3f14f337278017d1))

# [5.7.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.6.1...@ttoss/ui@5.7.0) (2025-06-06)

### Features

- add variants to tooltip component and new props ([#696](https://github.com/ttoss/ttoss/issues/696)) ([db4e440](https://github.com/ttoss/ttoss/commit/db4e440afc14cb7d1444a78e574dee2133de1405))

## [5.6.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.6.0...@ttoss/ui@5.6.1) (2025-06-06)

### Bug Fixes

- react notifications ([#694](https://github.com/ttoss/ttoss/issues/694)) ([009e00c](https://github.com/ttoss/ttoss/commit/009e00c1614576ddbb48fd8d5a0f080ed02b0a9e))

# [5.6.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.10...@ttoss/ui@5.6.0) (2025-06-02)

### Features

- created SegmentedControl ([#689](https://github.com/ttoss/ttoss/issues/689)) ([4c37608](https://github.com/ttoss/ttoss/commit/4c37608b6d83c1278353c5f2db464ee9a013472b))

## [5.5.10](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.9...@ttoss/ui@5.5.10) (2025-04-30)

### Bug Fixes

- button cursor ([#687](https://github.com/ttoss/ttoss/issues/687)) ([d5622a1](https://github.com/ttoss/ttoss/commit/d5622a13757d69615f56142cc81ccea99faf0b3c))

## [5.5.9](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.8...@ttoss/ui@5.5.9) (2025-04-29)

### Bug Fixes

- icon button oca ([724e2bc](https://github.com/ttoss/ttoss/commit/724e2bca23a094b7e1d028a20efbae1036e73b58))

## [5.5.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.7...@ttoss/ui@5.5.8) (2025-04-29)

### Bug Fixes

- action button status ([#686](https://github.com/ttoss/ttoss/issues/686)) ([d90af52](https://github.com/ttoss/ttoss/commit/d90af52c88f1224d354ef35880e104cef5f202c9))

## [5.5.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.6...@ttoss/ui@5.5.7) (2025-04-29)

**Note:** Version bump only for package @ttoss/ui

## [5.5.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.5...@ttoss/ui@5.5.6) (2025-03-02)

**Note:** Version bump only for package @ttoss/ui

## [5.5.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.4...@ttoss/ui@5.5.5) (2025-02-26)

**Note:** Version bump only for package @ttoss/ui

## [5.5.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.3...@ttoss/ui@5.5.4) (2025-02-11)

**Note:** Version bump only for package @ttoss/ui

## [5.5.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.2...@ttoss/ui@5.5.3) (2025-02-07)

### Bug Fixes

- parse pnpm to 10v, change tooltip style and add style to 'a' com… ([#663](https://github.com/ttoss/ttoss/issues/663)) ([43216bc](https://github.com/ttoss/ttoss/commit/43216bc45ec3a693981155bb930362e8f961bc96))

## [5.5.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.1...@ttoss/ui@5.5.2) (2025-02-03)

**Note:** Version bump only for package @ttoss/ui

## [5.5.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.5.0...@ttoss/ui@5.5.1) (2025-02-03)

### Bug Fixes

- spacing tokens from auth card, collapse layout and tooltip message ([#661](https://github.com/ttoss/ttoss/issues/661)) ([2e9d57a](https://github.com/ttoss/ttoss/commit/2e9d57a418d58daec4601a0c9e584e114bcbca04))

# [5.5.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.4.0...@ttoss/ui@5.5.0) (2025-01-31)

### Features

- new spacing to oca theme ([#660](https://github.com/ttoss/ttoss/issues/660)) ([2d43c1e](https://github.com/ttoss/ttoss/commit/2d43c1e750d3bd51870be54b357d1b1c9fb06868))

# [5.4.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.3.1...@ttoss/ui@5.4.0) (2025-01-27)

### Features

- add tab component unfinished yet integration with chakra ([#656](https://github.com/ttoss/ttoss/issues/656)) ([c9fe522](https://github.com/ttoss/ttoss/commit/c9fe522637d1ba271457ed20ffff2e84f3bebf45))

## [5.3.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.3.0...@ttoss/ui@5.3.1) (2025-01-24)

### Bug Fixes

- change tooltip position and color tokens ([#657](https://github.com/ttoss/ttoss/issues/657)) ([6a1460b](https://github.com/ttoss/ttoss/commit/6a1460b6f2a51a5fe087c4b3cc33a184bcc64c8e))

# [5.3.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.2.1...@ttoss/ui@5.3.0) (2025-01-23)

### Features

- add a new tooltip ([#652](https://github.com/ttoss/ttoss/issues/652)) ([a331fc1](https://github.com/ttoss/ttoss/commit/a331fc11cd83fb4f4cca96142a0bc136dc914d0f))

## [5.2.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.2.0...@ttoss/ui@5.2.1) (2025-01-19)

**Note:** Version bump only for package @ttoss/ui

# [5.2.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.6...@ttoss/ui@5.2.0) (2025-01-18)

### Features

- react notifications v2 ([#649](https://github.com/ttoss/ttoss/issues/649)) ([5cc3237](https://github.com/ttoss/ttoss/commit/5cc3237ecdb48b03b46c1b0fe4bef43d2e3f5046))

## [5.1.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.5...@ttoss/ui@5.1.6) (2025-01-13)

### Bug Fixes

- parse campaign card to Card storybook ([#647](https://github.com/ttoss/ttoss/issues/647)) ([eaf1b2b](https://github.com/ttoss/ttoss/commit/eaf1b2be5d1a2c3ad54e4ce08a0d44d58413ae88))

## [5.1.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.4...@ttoss/ui@5.1.5) (2025-01-12)

### Bug Fixes

- remove card from theme and style in component ([#646](https://github.com/ttoss/ttoss/issues/646)) ([964addc](https://github.com/ttoss/ttoss/commit/964addc34f04585712493f9953fb92305a21d88a))

## [5.1.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.3...@ttoss/ui@5.1.4) (2025-01-09)

### Bug Fixes

- stack component ([1c647e3](https://github.com/ttoss/ttoss/commit/1c647e34e520850f19817e366bdeb91fc9411d88))

## [5.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.2...@ttoss/ui@5.1.3) (2025-01-09)

**Note:** Version bump only for package @ttoss/ui

## [5.1.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.1...@ttoss/ui@5.1.2) (2025-01-08)

**Note:** Version bump only for package @ttoss/ui

## [5.1.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.1.0...@ttoss/ui@5.1.1) (2025-01-07)

**Note:** Version bump only for package @ttoss/ui

# [5.1.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.15...@ttoss/ui@5.1.0) (2025-01-07)

### Features

- add switch component ([#640](https://github.com/ttoss/ttoss/issues/640)) ([d03aaaf](https://github.com/ttoss/ttoss/commit/d03aaaf204110925d07db8ce8921f8b45547e91b))

## [5.0.15](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.14...@ttoss/ui@5.0.15) (2025-01-02)

### Bug Fixes

- eslint import rule ([#636](https://github.com/ttoss/ttoss/issues/636)) ([acb178f](https://github.com/ttoss/ttoss/commit/acb178f0a92b236b86af044b305ddea02bf0a714))

## [5.0.14](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.13...@ttoss/ui@5.0.14) (2024-12-31)

**Note:** Version bump only for package @ttoss/ui

## [5.0.13](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.12...@ttoss/ui@5.0.13) (2024-12-31)

**Note:** Version bump only for package @ttoss/ui

## 5.0.12 (2024-12-27)

### Bug Fixes

- add postgresdb to postgresdb-cli dep ([eb574dc](https://github.com/ttoss/ttoss/commit/eb574dcb29fb37c71a9fa378da413f95c68b656a))

## [5.0.11](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.10...@ttoss/ui@5.0.11) (2024-12-02)

**Note:** Version bump only for package @ttoss/ui

## [5.0.10](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.9...@ttoss/ui@5.0.10) (2024-11-26)

**Note:** Version bump only for package @ttoss/ui

## 5.0.9 (2024-11-22)

### Bug Fixes

- docs ([37143b2](https://github.com/ttoss/ttoss/commit/37143b2dfb515479c825e8eb42542cb306beab10))

## [5.0.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.7...@ttoss/ui@5.0.8) (2024-10-03)

**Note:** Version bump only for package @ttoss/ui

## [5.0.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.6...@ttoss/ui@5.0.7) (2024-09-27)

**Note:** Version bump only for package @ttoss/ui

## [5.0.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.5...@ttoss/ui@5.0.6) (2024-09-26)

**Note:** Version bump only for package @ttoss/ui

## [5.0.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.4...@ttoss/ui@5.0.5) (2024-09-17)

**Note:** Version bump only for package @ttoss/ui

## [5.0.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.3...@ttoss/ui@5.0.4) (2024-09-17)

**Note:** Version bump only for package @ttoss/ui

## [5.0.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.2...@ttoss/ui@5.0.3) (2024-09-17)

**Note:** Version bump only for package @ttoss/ui

## [5.0.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.1...@ttoss/ui@5.0.2) (2024-09-11)

**Note:** Version bump only for package @ttoss/ui

## [5.0.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@5.0.0...@ttoss/ui@5.0.1) (2024-09-11)

**Note:** Version bump only for package @ttoss/ui

# [5.0.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.17...@ttoss/ui@5.0.0) (2024-08-29)

### chore

- packages esm only ([#580](https://github.com/ttoss/ttoss/issues/580)) ([6fb3f9b](https://github.com/ttoss/ttoss/commit/6fb3f9b859ceb1c2b89dd5a97465ac7d7dd4f3a2))

### BREAKING CHANGES

- react packages is esm only now

## [4.1.17](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.16...@ttoss/ui@4.1.17) (2024-08-28)

**Note:** Version bump only for package @ttoss/ui

## [4.1.16](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.15...@ttoss/ui@4.1.16) (2024-08-20)

**Note:** Version bump only for package @ttoss/ui

## [4.1.15](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.14...@ttoss/ui@4.1.15) (2024-08-20)

**Note:** Version bump only for package @ttoss/ui

## 4.1.14 (2024-08-15)

### Bug Fixes

- change package name ([223ac3c](https://github.com/ttoss/ttoss/commit/223ac3cebe0c047e9a91e464de2151fc06187eee))
- checkbox ref ([#572](https://github.com/ttoss/ttoss/issues/572)) ([5345598](https://github.com/ttoss/ttoss/commit/5345598c9f1c4ba5f58adbc13aee14cdc79a97ad))

## [4.1.13](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.12...@ttoss/ui@4.1.13) (2024-06-28)

**Note:** Version bump only for package @ttoss/ui

## [4.1.12](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.11...@ttoss/ui@4.1.12) (2024-06-06)

### Bug Fixes

- decorators babel ([#560](https://github.com/ttoss/ttoss/issues/560)) ([cd2376a](https://github.com/ttoss/ttoss/commit/cd2376a67c37205b205ef4d7a64d8055c05531f1))
- remove workspace protocol from peerdeps ([31314d7](https://github.com/ttoss/ttoss/commit/31314d7a0c300751993f8558f21e37c8152f0483))

## [4.1.11](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.10...@ttoss/ui@4.1.11) (2024-05-31)

**Note:** Version bump only for package @ttoss/ui

## [4.1.10](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.9...@ttoss/ui@4.1.10) (2024-05-18)

**Note:** Version bump only for package @ttoss/ui

## [4.1.9](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.8...@ttoss/ui@4.1.9) (2024-05-04)

**Note:** Version bump only for package @ttoss/ui

## [4.1.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.7...@ttoss/ui@4.1.8) (2024-04-27)

**Note:** Version bump only for package @ttoss/ui

## [4.1.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.6...@ttoss/ui@4.1.7) (2024-04-17)

**Note:** Version bump only for package @ttoss/ui

## [4.1.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.5...@ttoss/ui@4.1.6) (2024-04-17)

**Note:** Version bump only for package @ttoss/ui

## 4.1.5 (2024-04-11)

### Bug Fixes

- return correct user email ([#523](https://github.com/ttoss/ttoss/issues/523)) ([0db4935](https://github.com/ttoss/ttoss/commit/0db493553f8b9c748b7edf4cd47bdbeeb5f53ee0))

## [4.1.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.3...@ttoss/ui@4.1.4) (2024-03-07)

**Note:** Version bump only for package @ttoss/ui

## [4.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.2...@ttoss/ui@4.1.3) (2024-02-29)

**Note:** Version bump only for package @ttoss/ui

## [4.1.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.1...@ttoss/ui@4.1.2) (2024-02-24)

**Note:** Version bump only for package @ttoss/ui

## [4.1.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.1.0...@ttoss/ui@4.1.1) (2024-02-22)

**Note:** Version bump only for package @ttoss/ui

# 4.1.0 (2024-01-30)

### Features

- principal tag mapping ([#468](https://github.com/ttoss/ttoss/issues/468)) ([cb9a135](https://github.com/ttoss/ttoss/commit/cb9a1355a179e65939aa8b215dfa0d624268b2b0))

## [4.0.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.6...@ttoss/ui@4.0.7) (2023-12-12)

### Bug Fixes

- upload template when size is big ([#453](https://github.com/ttoss/ttoss/issues/453)) ([59371b7](https://github.com/ttoss/ttoss/commit/59371b7eb9befa006ffe316541f60dfc534dcbd4))

## [4.0.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.5...@ttoss/ui@4.0.6) (2023-12-05)

**Note:** Version bump only for package @ttoss/ui

## [4.0.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.4...@ttoss/ui@4.0.5) (2023-12-01)

**Note:** Version bump only for package @ttoss/ui

## [4.0.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.3...@ttoss/ui@4.0.4) (2023-11-28)

### Bug Fixes

- remove exports and change to module ([#435](https://github.com/ttoss/ttoss/issues/435)) ([4e6ea74](https://github.com/ttoss/ttoss/commit/4e6ea74fbf646df3f677221ebad78becca2c26d4))

## [4.0.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.2...@ttoss/ui@4.0.3) (2023-11-23)

### Bug Fixes

- allow number on select ([#433](https://github.com/ttoss/ttoss/issues/433)) ([dbc1ee8](https://github.com/ttoss/ttoss/commit/dbc1ee85fc56b250d7ef9fc21a539732d4d81a77))

## [4.0.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.1...@ttoss/ui@4.0.2) (2023-11-23)

### Bug Fixes

- add disable to FormFieldSelect ([#432](https://github.com/ttoss/ttoss/issues/432)) ([aa14f74](https://github.com/ttoss/ttoss/commit/aa14f746c58035983391a367284f246b3ffb78f4))

## [4.0.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@4.0.0...@ttoss/ui@4.0.1) (2023-11-23)

**Note:** Version bump only for package @ttoss/ui

# [4.0.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.7...@ttoss/ui@4.0.0) (2023-11-22)

### Features

- Task 1363 pedro arantes criar select com filtering e scroll infinito ([#429](https://github.com/ttoss/ttoss/issues/429)) ([1caaedf](https://github.com/ttoss/ttoss/commit/1caaedf19b4270a25781a538c86e641e48a12624))

### BREAKING CHANGES

- update Select API. Removed children and added options.

## [3.1.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.6...@ttoss/ui@3.1.7) (2023-10-19)

**Note:** Version bump only for package @ttoss/ui

## [3.1.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.5...@ttoss/ui@3.1.6) (2023-10-10)

**Note:** Version bump only for package @ttoss/ui

## [3.1.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.4...@ttoss/ui@3.1.5) (2023-09-13)

**Note:** Version bump only for package @ttoss/ui

## [3.1.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.3...@ttoss/ui@3.1.4) (2023-08-28)

**Note:** Version bump only for package @ttoss/ui

## [3.1.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.2...@ttoss/ui@3.1.3) (2023-08-23)

**Note:** Version bump only for package @ttoss/ui

## [3.1.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.1...@ttoss/ui@3.1.2) (2023-08-22)

**Note:** Version bump only for package @ttoss/ui

## [3.1.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@3.1.0...@ttoss/ui@3.1.1) (2023-08-16)

### Bug Fixes

- carlin generate env ([#406](https://github.com/ttoss/ttoss/issues/406)) ([153ba71](https://github.com/ttoss/ttoss/commit/153ba71643461cdae076d3ba5779655f4988232c))

# [3.1.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@2.0.5...@ttoss/ui@3.1.0) (2023-08-15)

### Features

- create ttoss react-icons package ([#404](https://github.com/ttoss/ttoss/issues/404)) ([cd4c990](https://github.com/ttoss/ttoss/commit/cd4c990743da9bfd9d243d84adc38ad778824cc5))

## [2.0.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@2.0.4...@ttoss/ui@2.0.5) (2023-08-15)

**Note:** Version bump only for package @ttoss/ui

## [2.0.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@2.0.3...@ttoss/ui@2.0.4) (2023-07-17)

**Note:** Version bump only for package @ttoss/ui

## [2.0.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@2.0.2...@ttoss/ui@2.0.3) (2023-07-13)

**Note:** Version bump only for package @ttoss/ui

## [2.0.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@2.0.1...@ttoss/ui@2.0.2) (2023-07-05)

**Note:** Version bump only for package @ttoss/ui

## [2.0.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@2.0.0...@ttoss/ui@2.0.1) (2023-06-19)

**Note:** Version bump only for package @ttoss/ui

# [2.0.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.37.4...@ttoss/ui@2.0.0) (2023-06-19)

### chore

- update package.json ([#388](https://github.com/ttoss/ttoss/issues/388)) ([351a9d4](https://github.com/ttoss/ttoss/commit/351a9d4128e5268d79069ad15b8064c4a9acd906))

### BREAKING CHANGES

- emotion is a peer dep

## [1.37.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.37.3...@ttoss/ui@1.37.4) (2023-06-12)

**Note:** Version bump only for package @ttoss/ui

## [1.37.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.37.2...@ttoss/ui@1.37.3) (2023-06-12)

### Bug Fixes

- add repository to pacakge json ([8105c0a](https://github.com/ttoss/ttoss/commit/8105c0a0cf0d3b3de4a118f29014c2b5eb082d07))

## [1.37.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.37.1...@ttoss/ui@1.37.2) (2023-06-12)

**Note:** Version bump only for package @ttoss/ui

## [1.37.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.37.0...@ttoss/ui@1.37.1) (2023-06-06)

**Note:** Version bump only for package @ttoss/ui

# [1.37.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.12...@ttoss/ui@1.37.0) (2023-06-05)

### Features

- improve layouts module ([#377](https://github.com/ttoss/ttoss/issues/377)) ([f1d1578](https://github.com/ttoss/ttoss/commit/f1d15781930a8ec7d86e8f8c92f42335157ce7e2))

## [1.36.12](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.11...@ttoss/ui@1.36.12) (2023-06-02)

**Note:** Version bump only for package @ttoss/ui

## [1.36.11](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.10...@ttoss/ui@1.36.11) (2023-05-30)

**Note:** Version bump only for package @ttoss/ui

## [1.36.10](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.9...@ttoss/ui@1.36.10) (2023-05-26)

**Note:** Version bump only for package @ttoss/ui

## [1.36.9](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.8...@ttoss/ui@1.36.9) (2023-05-24)

**Note:** Version bump only for package @ttoss/ui

## [1.36.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.7...@ttoss/ui@1.36.8) (2023-05-23)

### Bug Fixes

- add dotenv to deploy app ([#363](https://github.com/ttoss/ttoss/issues/363)) ([351e985](https://github.com/ttoss/ttoss/commit/351e9853b6efce90f8bbf012098bfa5c8fd071a8))

## [1.36.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.6...@ttoss/ui@1.36.7) (2023-05-23)

**Note:** Version bump only for package @ttoss/ui

## [1.36.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.5...@ttoss/ui@1.36.6) (2023-05-16)

### Bug Fixes

- no matching export SelectProps ([#348](https://github.com/ttoss/ttoss/issues/348)) ([8c1c279](https://github.com/ttoss/ttoss/commit/8c1c279f4715a8520a2a5448c09e7d107e2f7293))

## [1.36.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.4...@ttoss/ui@1.36.5) (2023-05-16)

**Note:** Version bump only for package @ttoss/ui

## [1.36.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.3...@ttoss/ui@1.36.4) (2023-05-14)

**Note:** Version bump only for package @ttoss/ui

## [1.36.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.2...@ttoss/ui@1.36.3) (2023-05-12)

**Note:** Version bump only for package @ttoss/ui

## [1.36.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.1...@ttoss/ui@1.36.2) (2023-05-12)

**Note:** Version bump only for package @ttoss/ui

## [1.36.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.36.0...@ttoss/ui@1.36.1) (2023-05-10)

**Note:** Version bump only for package @ttoss/ui

# [1.36.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.35.3...@ttoss/ui@1.36.0) (2023-05-06)

### Features

- modal component working ([#333](https://github.com/ttoss/ttoss/issues/333)) ([adbf424](https://github.com/ttoss/ttoss/commit/adbf424b46aead19028b998c6e99ed8b2b7a8eb8))

## [1.35.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.35.2...@ttoss/ui@1.35.3) (2023-05-03)

### Bug Fixes

- UI issues ([#327](https://github.com/ttoss/ttoss/issues/327)) ([c0c0b0f](https://github.com/ttoss/ttoss/commit/c0c0b0f531fe785495dca89f6309e92c1ec9c59e))

## [1.35.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.35.1...@ttoss/ui@1.35.2) (2023-05-02)

**Note:** Version bump only for package @ttoss/ui

## [1.35.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.35.0...@ttoss/ui@1.35.1) (2023-04-28)

**Note:** Version bump only for package @ttoss/ui

# [1.35.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.34.2...@ttoss/ui@1.35.0) (2023-04-28)

### Features

- add retain to critical resources ([#312](https://github.com/ttoss/ttoss/issues/312)) ([288e9de](https://github.com/ttoss/ttoss/commit/288e9de4021f7b8109487e593d5a55c8f4798b92))

## [1.34.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.34.1...@ttoss/ui@1.34.2) (2023-04-27)

**Note:** Version bump only for package @ttoss/ui

## [1.34.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.34.0...@ttoss/ui@1.34.1) (2023-04-27)

**Note:** Version bump only for package @ttoss/ui

# [1.34.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.33.0...@ttoss/ui@1.34.0) (2023-04-26)

### Features

- export keyframes from ttoss ui ([#304](https://github.com/ttoss/ttoss/issues/304)) ([d06001d](https://github.com/ttoss/ttoss/commit/d06001d0c4380c83ffe275684efb7d54c348cc5a))

# [1.33.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.8...@ttoss/ui@1.33.0) (2023-04-25)

### Features

- add Global to @ttoss/ui ([#303](https://github.com/ttoss/ttoss/issues/303)) ([b323f29](https://github.com/ttoss/ttoss/commit/b323f2957ae90af0af910d377bbbd46512e22a5a))

## [1.32.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.7...@ttoss/ui@1.32.8) (2023-04-24)

**Note:** Version bump only for package @ttoss/ui

## [1.32.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.6...@ttoss/ui@1.32.7) (2023-04-21)

**Note:** Version bump only for package @ttoss/ui

## [1.32.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.5...@ttoss/ui@1.32.6) (2023-04-20)

**Note:** Version bump only for package @ttoss/ui

## [1.32.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.4...@ttoss/ui@1.32.5) (2023-04-19)

**Note:** Version bump only for package @ttoss/ui

## [1.32.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.3...@ttoss/ui@1.32.4) (2023-04-18)

**Note:** Version bump only for package @ttoss/ui

## [1.32.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.2...@ttoss/ui@1.32.3) (2023-04-18)

**Note:** Version bump only for package @ttoss/ui

## [1.32.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.1...@ttoss/ui@1.32.2) (2023-04-18)

**Note:** Version bump only for package @ttoss/ui

## [1.32.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.32.0...@ttoss/ui@1.32.1) (2023-04-16)

**Note:** Version bump only for package @ttoss/ui

# [1.32.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.18...@ttoss/ui@1.32.0) (2023-04-14)

### Features

- add stack component ([#271](https://github.com/ttoss/ttoss/issues/271)) ([275c559](https://github.com/ttoss/ttoss/commit/275c5593edaa5f3b29e40d7f349c6a1bd8e886e1))

## [1.31.18](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.17...@ttoss/ui@1.31.18) (2023-04-13)

**Note:** Version bump only for package @ttoss/ui

## [1.31.17](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.16...@ttoss/ui@1.31.17) (2023-04-13)

**Note:** Version bump only for package @ttoss/ui

## [1.31.16](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.15...@ttoss/ui@1.31.16) (2023-04-12)

### Bug Fixes

- set icon button type as button by default ([#268](https://github.com/ttoss/ttoss/issues/268)) ([cb5a926](https://github.com/ttoss/ttoss/commit/cb5a926bfdf66fbbe924e03f62153aabae8891c7))

## [1.31.15](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.14...@ttoss/ui@1.31.15) (2023-04-06)

**Note:** Version bump only for package @ttoss/ui

## [1.31.14](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.13...@ttoss/ui@1.31.14) (2023-04-06)

**Note:** Version bump only for package @ttoss/ui

## [1.31.13](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.12...@ttoss/ui@1.31.13) (2023-04-05)

**Note:** Version bump only for package @ttoss/ui

## [1.31.12](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.11...@ttoss/ui@1.31.12) (2023-04-05)

**Note:** Version bump only for package @ttoss/ui

## [1.31.11](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.10...@ttoss/ui@1.31.11) (2023-04-05)

**Note:** Version bump only for package @ttoss/ui

## [1.31.10](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.9...@ttoss/ui@1.31.10) (2023-04-04)

### Bug Fixes

- removed required icon property ([#261](https://github.com/ttoss/ttoss/issues/261)) ([fe19b7c](https://github.com/ttoss/ttoss/commit/fe19b7c4aeb103b25b5091320c9e64c01e741e30))

## [1.31.9](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.8...@ttoss/ui@1.31.9) (2023-04-03)

**Note:** Version bump only for package @ttoss/ui

## [1.31.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.7...@ttoss/ui@1.31.8) (2023-04-03)

**Note:** Version bump only for package @ttoss/ui

## [1.31.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.6...@ttoss/ui@1.31.7) (2023-03-31)

**Note:** Version bump only for package @ttoss/ui

## [1.31.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.5...@ttoss/ui@1.31.6) (2023-03-31)

**Note:** Version bump only for package @ttoss/ui

## [1.31.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.4...@ttoss/ui@1.31.5) (2023-03-30)

**Note:** Version bump only for package @ttoss/ui

## [1.31.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.3...@ttoss/ui@1.31.4) (2023-03-29)

**Note:** Version bump only for package @ttoss/ui

## [1.31.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.2...@ttoss/ui@1.31.3) (2023-03-26)

**Note:** Version bump only for package @ttoss/ui

## [1.31.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.1...@ttoss/ui@1.31.2) (2023-03-26)

**Note:** Version bump only for package @ttoss/ui

## [1.31.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.31.0...@ttoss/ui@1.31.1) (2023-03-22)

### Bug Fixes

- add type button as default ([#252](https://github.com/ttoss/ttoss/issues/252)) ([6429e7c](https://github.com/ttoss/ttoss/commit/6429e7c30e286a98316de9b109129c1b094f6680))

# [1.31.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.12...@ttoss/ui@1.31.0) (2023-03-20)

### Features

- add bruttal theme icons ([#249](https://github.com/ttoss/ttoss/issues/249)) ([df3d245](https://github.com/ttoss/ttoss/commit/df3d245901ea806b847bcce4af627c2c94fa12b3))

## [1.30.12](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.11...@ttoss/ui@1.30.12) (2023-03-17)

**Note:** Version bump only for package @ttoss/ui

## [1.30.11](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.10...@ttoss/ui@1.30.11) (2023-03-16)

**Note:** Version bump only for package @ttoss/ui

## [1.30.10](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.9...@ttoss/ui@1.30.10) (2023-03-15)

**Note:** Version bump only for package @ttoss/ui

## [1.30.9](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.7...@ttoss/ui@1.30.9) (2023-03-14)

**Note:** Version bump only for package @ttoss/ui

## [1.30.8](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.7...@ttoss/ui@1.30.8) (2023-03-14)

**Note:** Version bump only for package @ttoss/ui

## [1.30.7](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.6...@ttoss/ui@1.30.7) (2023-03-07)

### Bug Fixes

- **@ttoss/cloud-auth:** retain user pool ([#229](https://github.com/ttoss/ttoss/issues/229)) ([82c454c](https://github.com/ttoss/ttoss/commit/82c454c75baffea045b2a9d26e713e93d8da12f6))

## [1.30.6](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.5...@ttoss/ui@1.30.6) (2023-03-03)

**Note:** Version bump only for package @ttoss/ui

## [1.30.5](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.4...@ttoss/ui@1.30.5) (2023-03-01)

**Note:** Version bump only for package @ttoss/ui

## [1.30.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.3...@ttoss/ui@1.30.4) (2023-02-23)

### Bug Fixes

- **ui:** icon props ([#213](https://github.com/ttoss/ttoss/issues/213)) ([e2ea09a](https://github.com/ttoss/ttoss/commit/e2ea09a4258c73f3922663780f083bfdca5cd9ea))

## [1.30.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.2...@ttoss/ui@1.30.3) (2023-02-23)

### Bug Fixes

- radio reset checked ([#210](https://github.com/ttoss/ttoss/issues/210)) ([7ccfaa1](https://github.com/ttoss/ttoss/commit/7ccfaa12cbcd0ed9a666348a5faaa79629c727fd))

## [1.30.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.1...@ttoss/ui@1.30.2) (2023-02-15)

### Bug Fixes

- storybook build ([#198](https://github.com/ttoss/ttoss/issues/198)) ([2b683c9](https://github.com/ttoss/ttoss/commit/2b683c912492be3f708a700605193200b8f6d458))

## [1.30.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.30.0...@ttoss/ui@1.30.1) (2023-02-09)

**Note:** Version bump only for package @ttoss/ui

# 1.30.0 (2023-02-02)

### Features

- container ([#175](https://github.com/ttoss/ttoss/issues/175)) ([6ce60e7](https://github.com/ttoss/ttoss/commit/6ce60e7618818ca479d70ee1ee42cb2f02ca57b4))

# 1.29.0 (2023-01-11)

### Features

- task 445/improve cloud auth pedro arantes ([#148](https://github.com/ttoss/ttoss/issues/148)) ([e019266](https://github.com/ttoss/ttoss/commit/e0192663adf6b5a2a82eb0743827dba5ac72f85f))

# [1.28.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.27.3...@ttoss/ui@1.28.0) (2022-12-30)

### Features

- add textarea ([#130](https://github.com/ttoss/ttoss/issues/130)) ([d3886ca](https://github.com/ttoss/ttoss/commit/d3886cac27bdd84383d52660310682fe20dc2f84))

## [1.27.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.27.2...@ttoss/ui@1.27.3) (2022-12-24)

**Note:** Version bump only for package @ttoss/ui

## [1.27.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.27.1...@ttoss/ui@1.27.2) (2022-12-22)

**Note:** Version bump only for package @ttoss/ui

## [1.27.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.27.0...@ttoss/ui@1.27.1) (2022-12-19)

### Bug Fixes

- add side effects to false ([#108](https://github.com/ttoss/ttoss/issues/108)) ([859e083](https://github.com/ttoss/ttoss/commit/859e083c2dbdb6ede32f449df9341343c6de995e))

# [1.27.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.26.3...@ttoss/ui@1.27.0) (2022-12-18)

### Features

- update ui, notifications and i18n packages ([#94](https://github.com/ttoss/ttoss/issues/94)) ([928862d](https://github.com/ttoss/ttoss/commit/928862d01c276d645e1aac67e086d7b06939bf27))

## [1.26.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.26.2...@ttoss/ui@1.26.3) (2022-12-17)

### Bug Fixes

- make terezinha farm config private ([5a35424](https://github.com/ttoss/ttoss/commit/5a354243dc236a17e865500ea8ac0ba09d5b2cd2))
- manually update published packages ([8f891be](https://github.com/ttoss/ttoss/commit/8f891bee55997a9455c45299a6eee58811a556f2))

## [1.26.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.26.1...@ttoss/ui@1.26.2) (2022-12-16)

**Note:** Version bump only for package @ttoss/ui

## [1.26.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.26.0...@ttoss/ui@1.26.1) (2022-12-16)

**Note:** Version bump only for package @ttoss/ui

# [1.26.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.25.1...@ttoss/ui@1.26.0) (2022-12-13)

### Features

- ui infinite linear progress ([#79](https://github.com/ttoss/ttoss/issues/79)) ([5a9d0a5](https://github.com/ttoss/ttoss/commit/5a9d0a5f6ea2475590ea46f57571bc9208f9c2c5))

## [1.25.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.25.0...@ttoss/ui@1.25.1) (2022-12-10)

**Note:** Version bump only for package @ttoss/ui

# [1.25.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.23.1...@ttoss/ui@1.25.0) (2022-11-29)

### Features

- add new eslint rules ([#68](https://github.com/ttoss/ttoss/issues/68)) ([0a8c213](https://github.com/ttoss/ttoss/commit/0a8c213c1eae99a063448983e7fba83ebca4a609))

# [1.24.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.23.1...@ttoss/ui@1.24.0) (2022-11-29)

### Features

- add new eslint rules ([#68](https://github.com/ttoss/ttoss/issues/68)) ([0a8c213](https://github.com/ttoss/ttoss/commit/0a8c213c1eae99a063448983e7fba83ebca4a609))

## [1.23.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.23.0...@ttoss/ui@1.23.1) (2022-11-29)

**Note:** Version bump only for package @ttoss/ui

# [1.23.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.22.0...@ttoss/ui@1.23.0) (2022-11-23)

### Features

- exporting Checkbox component ([#65](https://github.com/ttoss/ttoss/issues/65)) ([a7b0eb6](https://github.com/ttoss/ttoss/commit/a7b0eb6358d90b465fbce65dd4c4dd53badd54af))

# [1.22.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.21.3...@ttoss/ui@1.22.0) (2022-11-16)

### Features

- add stories Heading ([#63](https://github.com/ttoss/ttoss/issues/63)) ([f220d35](https://github.com/ttoss/ttoss/commit/f220d35cd5015f8c3b0422a89daeedc5f646d089))

## [1.21.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.21.2...@ttoss/ui@1.21.3) (2022-11-11)

**Note:** Version bump only for package @ttoss/ui

## [1.21.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.21.1...@ttoss/ui@1.21.2) (2022-11-04)

**Note:** Version bump only for package @ttoss/ui

## [1.21.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.21.0...@ttoss/ui@1.21.1) (2022-10-31)

**Note:** Version bump only for package @ttoss/ui

# [1.21.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.20.4...@ttoss/ui@1.21.0) (2022-10-10)

### Features

- **@ttoss/ui:** add radio ([#53](https://github.com/ttoss/ttoss/issues/53)) ([431017b](https://github.com/ttoss/ttoss/commit/431017b3dd22703d4fb395c7a1d2522011e4cbb0))

## [1.20.4](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.20.2...@ttoss/ui@1.20.4) (2022-10-08)

**Note:** Version bump only for package @ttoss/ui

## [1.20.3](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.20.2...@ttoss/ui@1.20.3) (2022-10-08)

**Note:** Version bump only for package @ttoss/ui

## [1.20.2](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.20.1...@ttoss/ui@1.20.2) (2022-10-05)

**Note:** Version bump only for package @ttoss/ui

## [1.20.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.20.0...@ttoss/ui@1.20.1) (2022-10-05)

**Note:** Version bump only for package @ttoss/ui

# [1.20.0](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.19.1...@ttoss/ui@1.20.0) (2022-09-26)

### Features

- forms first implementation ([#42](https://github.com/ttoss/ttoss/issues/42)) ([0c4b37e](https://github.com/ttoss/ttoss/commit/0c4b37ef55dd6c9101589ec40a84ae668d0dd13e))

## [1.19.1](https://github.com/ttoss/ttoss/compare/@ttoss/ui@1.19.0...@ttoss/ui@1.19.1) (2022-09-20)

**Note:** Version bump only for package @ttoss/ui

# 1.19.0 (2022-08-07)

### Features

- add toast ([#28](https://github.com/ttoss/ttoss/issues/28)) ([da1dfc7](https://github.com/ttoss/ttoss/commit/da1dfc7f0fea3d69b61c82c2ced8612c7be65f8b))

# 1.18.0 (2022-07-14)

### Features

- create modal component ([#17](https://github.com/ttoss/ttoss/issues/17)) ([b89db3f](https://github.com/ttoss/ttoss/commit/b89db3fb7ae16973667e07ab2dcf0e492cf4043a))

## 1.16.5 (2022-06-29)

# [1.18.0](https://github.com/ttoss/ttoss/compare/v1.17.0...v1.18.0) (2022-07-14)

### Features

- create modal component ([#17](https://github.com/ttoss/ttoss/issues/17)) ([b89db3f](https://github.com/ttoss/ttoss/commit/b89db3fb7ae16973667e07ab2dcf0e492cf4043a))

## [1.16.5](https://github.com/ttoss/ttoss/compare/v1.16.4...v1.16.5) (2022-06-29)

**Note:** Version bump only for package @ttoss/ui

## [1.15.2](https://github.com/ttoss/modules/compare/v1.15.1...v1.15.2) (2022-05-06)

**Note:** Version bump only for package @ttoss/ui

## [1.15.1](https://github.com/ttoss/modules/compare/v1.15.0...v1.15.1) (2022-05-06)

**Note:** Version bump only for package @ttoss/ui

# [1.15.0](https://github.com/ttoss/modules/compare/v1.14.4...v1.15.0) (2022-05-06)

**Note:** Version bump only for package @ttoss/ui

## [1.14.4](https://github.com/ttoss/modules/compare/v1.14.3...v1.14.4) (2022-04-27)

**Note:** Version bump only for package @ttoss/ui

## [1.14.3](https://github.com/ttoss/modules/compare/v1.14.2...v1.14.3) (2022-04-24)

**Note:** Version bump only for package @ttoss/ui

## [1.14.2](https://github.com/ttoss/modules/compare/v1.14.1...v1.14.2) (2022-04-22)

### Bug Fixes

- **ui:** add mdx-js react v1 ([bcda537](https://github.com/ttoss/modules/commit/bcda5370a92306f31f73c6bb404bd0f8c8f96561))

## [1.14.1](https://github.com/ttoss/modules/compare/v1.14.0...v1.14.1) (2022-04-20)

**Note:** Version bump only for package @ttoss/ui

# [1.14.0](https://github.com/ttoss/modules/compare/v1.13.2...v1.14.0) (2022-04-18)

### Features

- adding and exporting Select component from ui ([#83](https://github.com/ttoss/modules/issues/83)) ([4833553](https://github.com/ttoss/modules/commit/4833553d1d033126ae88d363911b11c36641c0c3))

## [1.13.2](https://github.com/ttoss/modules/compare/v1.13.1...v1.13.2) (2022-04-14)

**Note:** Version bump only for package @ttoss/ui

## [1.13.1](https://github.com/ttoss/modules/compare/v1.13.0...v1.13.1) (2022-04-08)

**Note:** Version bump only for package @ttoss/ui

# [1.13.0](https://github.com/ttoss/modules/compare/v1.12.2...v1.13.0) (2022-03-31)

### Features

- add msw api example ([#81](https://github.com/ttoss/modules/issues/81)) ([030bbda](https://github.com/ttoss/modules/commit/030bbdacba21b3ee9ea4e1fec147cf2137bf7854))

## [1.12.2](https://github.com/ttoss/modules/compare/v1.12.1...v1.12.2) (2022-03-25)

**Note:** Version bump only for package @ttoss/ui

## [1.12.1](https://github.com/ttoss/modules/compare/v1.12.0...v1.12.1) (2022-03-22)

### Bug Fixes

- update configs ([#79](https://github.com/ttoss/modules/issues/79)) ([f88b557](https://github.com/ttoss/modules/commit/f88b557f0e6370f2e520ac34b505734bace34f52))

# [1.12.0](https://github.com/ttoss/modules/compare/v1.11.7...v1.12.0) (2022-03-20)

**Note:** Version bump only for package @ttoss/ui

## [1.11.7](https://github.com/ttoss/modules/compare/v1.11.6...v1.11.7) (2022-03-18)

**Note:** Version bump only for package @ttoss/ui

## [1.11.6](https://github.com/ttoss/modules/compare/v1.11.5...v1.11.6) (2022-03-18)

**Note:** Version bump only for package @ttoss/ui

## [1.11.5](https://github.com/ttoss/modules/compare/v1.11.4...v1.11.5) (2022-03-18)

**Note:** Version bump only for package @ttoss/ui

## [1.11.4](https://github.com/ttoss/modules/compare/v1.11.3...v1.11.4) (2022-03-14)

**Note:** Version bump only for package @ttoss/ui

## [1.11.3](https://github.com/ttoss/modules/compare/v1.11.2...v1.11.3) (2022-03-09)

**Note:** Version bump only for package @ttoss/ui

## [1.11.2](https://github.com/ttoss/modules/compare/v1.11.1...v1.11.2) (2022-03-08)

**Note:** Version bump only for package @ttoss/ui

## [1.11.1](https://github.com/ttoss/modules/compare/v1.11.0...v1.11.1) (2022-03-08)

**Note:** Version bump only for package @ttoss/ui

# [1.11.0](https://github.com/ttoss/modules/compare/v1.10.0...v1.11.0) (2022-03-05)

### Features

- add typescript to config ([#66](https://github.com/ttoss/modules/issues/66)) ([e6b26d0](https://github.com/ttoss/modules/commit/e6b26d09fb01677159cfe56c64a780063d5d583f))

# [1.10.0](https://github.com/ttoss/modules/compare/v1.9.6...v1.10.0) (2022-03-05)

**Note:** Version bump only for package @ttoss/ui

## [1.9.6](https://github.com/ttoss/modules/compare/v1.9.5...v1.9.6) (2022-03-04)

**Note:** Version bump only for package @ttoss/ui

## [1.9.5](https://github.com/ttoss/modules/compare/v1.9.4...v1.9.5) (2022-03-04)

**Note:** Version bump only for package @ttoss/ui

## [1.9.4](https://github.com/ttoss/modules/compare/v1.9.3...v1.9.4) (2022-03-03)

**Note:** Version bump only for package @ttoss/ui

## [1.9.3](https://github.com/ttoss/modules/compare/v1.9.2...v1.9.3) (2022-03-02)

**Note:** Version bump only for package @ttoss/ui

## [1.9.2](https://github.com/ttoss/modules/compare/v1.9.1...v1.9.2) (2022-03-02)

**Note:** Version bump only for package @ttoss/ui

## [1.9.1](https://github.com/ttoss/modules/compare/v1.9.0...v1.9.1) (2022-02-20)

### Bug Fixes

- auth layout ([#51](https://github.com/ttoss/modules/issues/51)) ([ba72020](https://github.com/ttoss/modules/commit/ba7202076f7469a8d478b6e80327d0ae37b0400b))

# [1.9.0](https://github.com/ttoss/modules/compare/v1.8.2...v1.9.0) (2022-02-15)

**Note:** Version bump only for package @ttoss/ui

## [1.8.2](https://github.com/ttoss/modules/compare/v1.8.1...v1.8.2) (2022-02-13)

**Note:** Version bump only for package @ttoss/ui

## [1.8.1](https://github.com/ttoss/modules/compare/v1.8.0...v1.8.1) (2022-02-13)

**Note:** Version bump only for package @ttoss/ui

# [1.8.0](https://github.com/ttoss/modules/compare/v1.7.3...v1.8.0) (2022-02-13)

### Features

- deploy docs and create components package ([1c6d581](https://github.com/ttoss/modules/commit/1c6d5813185eec5e88672bb1547d1b23578eb76b))

## [1.7.3](https://github.com/ttoss/modules/compare/v1.7.2...v1.7.3) (2022-02-10)

**Note:** Version bump only for package @ttoss/ui

## [1.7.2](https://github.com/ttoss/modules/compare/v1.7.1...v1.7.2) (2022-02-10)

**Note:** Version bump only for package @ttoss/ui

## [1.7.1](https://github.com/ttoss/modules/compare/v1.7.0...v1.7.1) (2022-02-09)

**Note:** Version bump only for package @ttoss/ui

# [1.7.0](https://github.com/ttoss/modules/compare/v1.6.0...v1.7.0) (2022-02-09)

**Note:** Version bump only for package @ttoss/ui

# [1.6.0](https://github.com/ttoss/modules/compare/v1.5.0...v1.6.0) (2022-02-04)

### Features

- add fonts to theme provider ([#42](https://github.com/ttoss/modules/issues/42)) ([6ef9cea](https://github.com/ttoss/modules/commit/6ef9cea3db705a80d39fd50aef75800065fafc28))

# [1.5.0](https://github.com/ttoss/modules/compare/v1.4.1...v1.5.0) (2022-02-04)

**Note:** Version bump only for package @ttoss/ui

## [1.4.1](https://github.com/ttoss/modules/compare/v1.4.0...v1.4.1) (2022-02-03)

**Note:** Version bump only for package @ttoss/ui

# [1.4.0](https://github.com/ttoss/modules/compare/v1.3.0...v1.4.0) (2022-02-03)

### Features

- notifications module ([#36](https://github.com/ttoss/modules/issues/36)) ([374b528](https://github.com/ttoss/modules/commit/374b528e832bf7caee6fb742a8be7fdafbcbd297))

# [1.3.0](https://github.com/ttoss/modules/compare/v1.2.0...v1.3.0) (2022-01-27)

### Features

- auth logo ([#32](https://github.com/ttoss/modules/issues/32)) ([17bdf97](https://github.com/ttoss/modules/commit/17bdf978cc5f10c72452611c85778d6d75c3aa87))

# [1.2.0](https://github.com/ttoss/modules/compare/v1.1.0...v1.2.0) (2022-01-26)

### Features

- create auth container ([#30](https://github.com/ttoss/modules/issues/30)) ([9fb4fe6](https://github.com/ttoss/modules/commit/9fb4fe66fc2bdf8e116f2ebe7a94251655d0d06a))

# [1.1.0](https://github.com/ttoss/modules/compare/v0.9.2...v1.1.0) (2022-01-24)

### Features

- auth styles ([#25](https://github.com/ttoss/modules/issues/25)) ([06600d9](https://github.com/ttoss/modules/commit/06600d9ed24ec99ab563810edb3e7fbc99f58564))

## [0.9.2](https://github.com/ttoss/modules/compare/v0.9.1...v0.9.2) (2022-01-19)

### Bug Fixes

- UI variant ([#24](https://github.com/ttoss/modules/issues/24)) ([f018aa7](https://github.com/ttoss/modules/commit/f018aa7ed8b80b9787c88f096f060aedbed81957))

## [0.9.1](https://github.com/ttoss/modules/compare/v0.9.0...v0.9.1) (2022-01-18)

### Bug Fixes

- theme provider ([#23](https://github.com/ttoss/modules/issues/23)) ([7b5d754](https://github.com/ttoss/modules/commit/7b5d7542a7126954c55d67e7fb91c681a09e0996))

# [0.9.0](https://github.com/ttoss/modules/compare/v0.8.5...v0.9.0) (2022-01-18)

**Note:** Version bump only for package @ttoss/ui

## [0.8.5](https://github.com/ttoss/modules/compare/v0.8.4...v0.8.5) (2022-01-17)

**Note:** Version bump only for package @ttoss/ui

## [0.8.4](https://github.com/ttoss/modules/compare/v0.8.3...v0.8.4) (2022-01-17)

**Note:** Version bump only for package @ttoss/ui

## [0.8.3](https://github.com/ttoss/modules/compare/v0.8.2...v0.8.3) (2022-01-04)

**Note:** Version bump only for package @ttoss/ui

## [0.8.2](https://github.com/ttoss/modules/compare/v0.8.1...v0.8.2) (2022-01-04)

**Note:** Version bump only for package @ttoss/ui

## [0.8.1](https://github.com/ttoss/modules/compare/v0.8.0...v0.8.1) (2021-12-23)

**Note:** Version bump only for package @ttoss/ui

# [0.8.0](https://github.com/ttoss/modules/compare/v0.7.0...v0.8.0) (2021-12-23)

**Note:** Version bump only for package @ttoss/ui

# [0.7.0](https://github.com/ttoss/modules/compare/v0.6.2...v0.7.0) (2021-09-08)

**Note:** Version bump only for package @ttoss/ui

## [0.6.2](https://github.com/ttoss/modules/compare/v0.6.1...v0.6.2) (2021-09-07)

**Note:** Version bump only for package @ttoss/ui

## [0.6.1](https://github.com/ttoss/modules/compare/v0.6.0...v0.6.1) (2021-09-07)

### Bug Fixes

- ui props export ([3fd761c](https://github.com/ttoss/modules/commit/3fd761cf5e9c3081586a14b359195192a65874d0))

# [0.6.0](https://github.com/ttoss/modules/compare/v0.5.1...v0.6.0) (2021-09-07)

### Features

- maps first implementation ([3191e60](https://github.com/ttoss/modules/commit/3191e609011d764586bb0e32664dc4d110413002))

## [0.5.1](https://github.com/ttoss/modules/compare/v0.5.0...v0.5.1) (2021-09-07)

**Note:** Version bump only for package @ttoss/ui

# 0.5.0 (2021-09-07)

### Features

- auth first implementation ([2309b75](https://github.com/ttoss/modules/commit/2309b7552b8e659254f334069999f04eaf3f57b0))
- creating ttoss Storybook ([a652a2e](https://github.com/ttoss/modules/commit/a652a2ee473fba647a9dd32c1a90a35936a74107))
- new packages structure ([a82a3ea](https://github.com/ttoss/modules/commit/a82a3ea8ef5c6082528047734a4654a4ae322d39))
- ui first implementation ([44ec22d](https://github.com/ttoss/modules/commit/44ec22dff6a76e25f5bef0cde3735115460b972f))
