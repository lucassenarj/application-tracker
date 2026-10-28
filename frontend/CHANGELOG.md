# [frontend-v1.2.1](https://github.com/lucassenarj/application-tracker/compare/frontend-v1.2.0...frontend-v1.2.1) (2026-10-28)


### Bug Fixes

* **frontend:** add SPA fallback rewrite so page refreshes on deep routes don't 404 ([14a41e5](https://github.com/lucassenarj/application-tracker/commit/14a41e58c0aa94a14f5e77b63f34fe751f165e77))

# [frontend-v1.2.0](https://github.com/lucassenarj/application-tracker/compare/frontend-v1.1.1...frontend-v1.2.0) (2026-10-28)


### Bug Fixes

* **application:** add a pointer cursor to buttons ([b0e6780](https://github.com/lucassenarj/application-tracker/commit/b0e6780482660b10c690b6f4d70cadff03def667))
* **application:** add template-matching hover effects and card entrance animation ([1f45ba2](https://github.com/lucassenarj/application-tracker/commit/1f45ba24a8486d397eb3862b67d45a07d0429c9d))
* **application:** match page title size and section spacing to the template ([dfb6177](https://github.com/lucassenarj/application-tracker/commit/dfb61776cf634d958c5e981e9bc7a1f023511867))
* **application:** match sidebar nav item sizing and header divider to the template ([10a2bef](https://github.com/lucassenarj/application-tracker/commit/10a2bef714b556709800c15b4d258dbb6b63fa1d))
* **application:** match sidebar width, nav item colors, and item spacing to the template ([34d6673](https://github.com/lucassenarj/application-tracker/commit/34d6673ab9c9cb9c70a4281476a5488a4b53cd46))
* **application:** match table padding/colors and restyle the Add Application button to the template ([02003cf](https://github.com/lucassenarj/application-tracker/commit/02003cfeea25195d78173336e56fdf36b20bee8b))
* **application:** restyle form fields and dialogs to match the template ([c11dff4](https://github.com/lucassenarj/application-tracker/commit/c11dff477664268acb0ed4952876a28c5a149292))
* **application:** widen the login/register card to match the template ([b814591](https://github.com/lucassenarj/application-tracker/commit/b814591d2aca812648f61f5337f951122d4a745d))
* **identity:** silently refresh the access token on 401 instead of forcing re-login ([e466927](https://github.com/lucassenarj/application-tracker/commit/e466927400b19ac390cbf564c24051def5b7504d))


### Features

* **application:** add a 3D tilt effect to dashboard stat cards ([45d01ed](https://github.com/lucassenarj/application-tracker/commit/45d01ed077840c6b4e7718931306cd41694aeef5))
* **application:** add a getChartTicks helper for scaling chart Y-axis values ([c098529](https://github.com/lucassenarj/application-tracker/commit/c098529b0a4dc1b85e3364fc5ac63b42c74a8f7e))
* **application:** add a getMonthGridDays helper for the Upcoming Interviews calendar ([f1ea805](https://github.com/lucassenarj/application-tracker/commit/f1ea805fdb6f978c0cc95b3dbd7bfd79dd15a88b))
* **application:** add a Recent Activity feed widget ([28fc930](https://github.com/lucassenarj/application-tracker/commit/28fc93060f5c34ba8161f343575a6accd9b9e1e1))
* **application:** add a Security settings page scaffold (not yet linked) ([34877dc](https://github.com/lucassenarj/application-tracker/commit/34877dcbca82f6faea24e5b85b384046e799ee3f))
* **application:** add a status breakdown donut chart and category progress bars to the dashboard ([e590b7a](https://github.com/lucassenarj/application-tracker/commit/e590b7aefb15b94298d3fa0e3883260d1795fcc5))
* **application:** add an animated gradient background ([a742aa3](https://github.com/lucassenarj/application-tracker/commit/a742aa3365c5c2f72e045023d5c6ee93171f9d9e))
* **application:** add an Applications Over Time bar chart widget ([0138697](https://github.com/lucassenarj/application-tracker/commit/0138697da030982b876bb91a6b15bd94704a287c))
* **application:** add glass-admin color tokens, fonts, and card/sidebar blur ([4cbef47](https://github.com/lucassenarj/application-tracker/commit/4cbef47eca859ed13d4f93cce4ce78d264b72700))
* **application:** add Google Analytics with a consent banner ([fd8ec81](https://github.com/lucassenarj/application-tracker/commit/fd8ec81658736aaf658efb4694847d4c610b6083))
* **application:** add loading feedback for route transitions and auth checks ([1090bc2](https://github.com/lucassenarj/application-tracker/commit/1090bc2dff6bf134f28bf724a4b89591eb5d8570))
* **application:** add locale-aware currency and relative-time formatting ([19bf431](https://github.com/lucassenarj/application-tracker/commit/19bf431b9276bbac7ebb0eed260475da331fda21))
* **application:** add page breadcrumbs and box the detail page sections ([fbf0f50](https://github.com/lucassenarj/application-tracker/commit/fbf0f5031e2a22ec3fed41781bfd99d61d5dc6c8))
* **application:** add Upcoming Interviews calendar and agenda list widgets ([9947b22](https://github.com/lucassenarj/application-tracker/commit/9947b223d708d71a5db50dfa9302f33afec98aeb))
* **application:** color-code the Recent Activity status text by outcome ([d185ae9](https://github.com/lucassenarj/application-tracker/commit/d185ae9eafe889d9f311ded227565cbb0fc3862c))
* **application:** move the theme toggle to the page title row and make the sidebar trigger mobile-only ([8d2e6e9](https://github.com/lucassenarj/application-tracker/commit/8d2e6e93c78f21b240d22a217078478acccc557e))
* **application:** rebuild the Applications List as a bordered table with status badges and relative update times ([752bff7](https://github.com/lucassenarj/application-tracker/commit/752bff7e78ac37aa2674e4d6bbc98d9c529a260d))
* **application:** rebuild the Dashboard's Latest Applications as a table, drop inline status editing ([4fb2360](https://github.com/lucassenarj/application-tracker/commit/4fb2360b7a2f0bfa1e3f8891233fa9f81ac7479f))
* **application:** rebuild the Profile page to match the template ([de195ee](https://github.com/lucassenarj/application-tracker/commit/de195ee9785c7bac9df6f019c8a0926010214724))
* **application:** resize form controls and redesign the login/register pages ([55938e6](https://github.com/lucassenarj/application-tracker/commit/55938e686f787566f513cb27abc401c641c04eda))
* **application:** restructure the Dashboard layout around the new Upcoming Interviews widgets ([bd7a7df](https://github.com/lucassenarj/application-tracker/commit/bd7a7dfaaf362978f15aa08d1a53c81cde78647c))
* **application:** restyle the sidebar shell, account menu, and theme toggle ([b91c7c7](https://github.com/lucassenarj/application-tracker/commit/b91c7c7093392e1c956253ee13c21d1ba668c447))
* **application:** scope the interviews calendar to the displayed month and add a click-triggered day popover ([071759a](https://github.com/lucassenarj/application-tracker/commit/071759af6b04ec17c24ae0d3f2034b63e56fb016))
* **application:** show the Over Time chart beside Recent Activity ([3720b90](https://github.com/lucassenarj/application-tracker/commit/3720b9098183563397c9c49035fb9a9e6dfc0fb4))
* **application:** split sidebar nav into Main Menu and Account sections ([c9aced0](https://github.com/lucassenarj/application-tracker/commit/c9aced0d5693ddb8471380893bd36b831def335f))
* **application:** use semantic HTML for Card titles/descriptions and wire the Recent Activity feed into the Dashboard ([6a29c96](https://github.com/lucassenarj/application-tracker/commit/6a29c96429d20d0cccf71a5700a419962632aec8))
* **application:** use the real per-application currency instead of hardcoded EUR ([d5dbc14](https://github.com/lucassenarj/application-tracker/commit/d5dbc145c4ce309bf825d46f1fbcc65fe0375f98))
* **frontend:** add real logo and favicon, replacing placeholders ([7d0ef35](https://github.com/lucassenarj/application-tracker/commit/7d0ef3533cf5579e2d28a839a2b5e4f7ce1c895c))
* **frontend:** display the release version in a page footer ([c0165e5](https://github.com/lucassenarj/application-tracker/commit/c0165e57439d78d65d6c8cafdae866436a0961b3))
* **frontend:** redesign the login page to match the glass-admin template ([609b868](https://github.com/lucassenarj/application-tracker/commit/609b8687877912ffc2250e64444a91dab62a0a21))
* **frontend:** redesign the register page to match the glass-admin template ([b6d6425](https://github.com/lucassenarj/application-tracker/commit/b6d642571442dd0c4f2fb2da085a7294a71b62e0))
* **frontend:** wire up the remember-me checkbox on login ([09161cc](https://github.com/lucassenarj/application-tracker/commit/09161cc6aaa5c577736a295fa16a8d0fb721796d))
* **identity:** add a Default Currency profile preference and use it in the create-application form ([e710948](https://github.com/lucassenarj/application-tracker/commit/e7109480fd0faf24926457f4de6561ca77f47ddf))
* **identity:** wire Profile's phone, bio, and language fields to the real API ([0e28614](https://github.com/lucassenarj/application-tracker/commit/0e28614e3b00f39878a347745ea2dc44ec4cae3a))

# [frontend-v1.1.1](https://github.com/lucassenarj/application-tracker/compare/frontend-v1.1.0...frontend-v1.1.1) (2026-10-02)


### Bug Fixes

* **application:** add a dynamic per-page document title ([6c4ee3d](https://github.com/lucassenarj/application-tracker/commit/6c4ee3d9182b781612dbfa288daebe68b5956e9c))
* **application:** fix show/hide password toggle and a minimal header to the login and register pages ([945198a](https://github.com/lucassenarj/application-tracker/commit/945198ac0c3bb41cbdb21dfeda4ec6fa0441e65d))
* **application:** make dashboard summary cards link to the filtered applications list ([04f2855](https://github.com/lucassenarj/application-tracker/commit/04f2855cb43976b3b60a5f015babe25a22cebb94))

# [frontend-v1.1.0](https://github.com/lucassenarj/application-tracker/compare/frontend-v1.0.0...frontend-v1.1.0) (2026-10-02)


### Bug Fixes

* **application:** cap textarea and dialog growth and widen dialogs to prevent viewport overflow ([0228074](https://github.com/lucassenarj/application-tracker/commit/0228074a6a29ce2358b1dd6e3c4259f3db419145))
* **application:** make Dashboard's latest applications clickable to detail ([d16726a](https://github.com/lucassenarj/application-tracker/commit/d16726ac6d76e0d89ea9fb12e5ebc405a9bbeff5))
* **application:** size select dropdowns to fit their widest option instead of clipping text ([8fd1085](https://github.com/lucassenarj/application-tracker/commit/8fd1085bdb52477e39da694c4881cdf9246e46a8))
* **frontend:** handle empty response bodies in apiFetch ([d5195cc](https://github.com/lucassenarj/application-tracker/commit/d5195cc5c1abb2a64711407d1876fd85d17d8d77))
* **frontend:** properly clear cached user on logout ([9d1be7e](https://github.com/lucassenarj/application-tracker/commit/9d1be7e04ee223a901a9470c2570c7eb5bf9e0d7))
* **frontend:** replace history entry on Applications List filter/page changes ([56471f8](https://github.com/lucassenarj/application-tracker/commit/56471f8626f058f4b561bf0489e30749ca964f4b))
* **frontend:** resolve shadcn CLI writing files to a literal @/ folder ([f215f7a](https://github.com/lucassenarj/application-tracker/commit/f215f7addee649cc179a4a63128d70ee43b58588))


### Features

* **application:** add a Back button and fix Change Status button spacing on the detail page ([5948b3a](https://github.com/lucassenarj/application-tracker/commit/5948b3a65bf17cc45d4ca28e7ed2a69b280a03ae))
* **application:** add a colored vertical status timeline with interview, contact, and notes details ([fb5b9a2](https://github.com/lucassenarj/application-tracker/commit/fb5b9a2843823a0c7e62552970f431514be351f9))
* **application:** add a New Application button to the dashboard ([a098f70](https://github.com/lucassenarj/application-tracker/commit/a098f705877f7d01adb515176dc672d0f426061f))
* **application:** add application detail page with status-change dialog ([1b3481a](https://github.com/lucassenarj/application-tracker/commit/1b3481a105e817d55180ff76e41a4c5c313d82f9))
* **application:** add category tabs and inline status editing to the applications list ([be6fd39](https://github.com/lucassenarj/application-tracker/commit/be6fd390578365125e912530c9ec0926fff099a6))
* **application:** add debounced search to the applications list ([dbf82fc](https://github.com/lucassenarj/application-tracker/commit/dbf82fc54c905af19ffcc86d449f35423f26ce22))
* **application:** add inline status editing to the dashboard's latest applications list ([d398358](https://github.com/lucassenarj/application-tracker/commit/d3983589c4df919542aa7eba1c915d33aa26554b))
* **application:** show salary, job posting link, and description on the detail page ([38a227f](https://github.com/lucassenarj/application-tracker/commit/38a227f758d0aec6f3958c24a14f6771123eafa2))
* **application:** split the detail page into a 2:1 layout and make the description collapsible on mobile ([d0d99ed](https://github.com/lucassenarj/application-tracker/commit/d0d99ed9a8e8832ec739d96f24657a085ae3efd9))
* **application:** support controlled mode and hide the trigger when there are no available transitions in ChangeStatusDialog ([5f708be](https://github.com/lucassenarj/application-tracker/commit/5f708bec87d5e9f64e4e64eca5ef3d2fd7feb9a6))
* **application:** wrap the profile page in cards and show the applications-tracked count ([2d13d60](https://github.com/lucassenarj/application-tracker/commit/2d13d602700417a537ca34e9b6517fb9f02f1742))
* **frontend:** add Applications List page ([f5c01d1](https://github.com/lucassenarj/application-tracker/commit/f5c01d133cd97fe0c7ea4da16ea752c6193e9f05))
* **frontend:** add dashboard summary cards with stats query ([6af564c](https://github.com/lucassenarj/application-tracker/commit/6af564cfc9c98e1cc4622170a94510e42cf40161))
* **frontend:** add latest applications list to the dashboard ([48f1135](https://github.com/lucassenarj/application-tracker/commit/48f113595bbc0727a486ca1d898b6f976730b022))
* **frontend:** add light/dark mode toggle ([c70f69a](https://github.com/lucassenarj/application-tracker/commit/c70f69a92b7c3f6cd066e0fcea21ed5189f51f55))
* **frontend:** add Login and Register pages ([0a42b1b](https://github.com/lucassenarj/application-tracker/commit/0a42b1bfd33ca30bb97272925970c6e10b7d579c))
* **frontend:** add New Application modal ([b425bad](https://github.com/lucassenarj/application-tracker/commit/b425bad55da8945436a8854f70c178d4b1f70e51))
* **frontend:** add persistent nav bar with logout ([57d8c03](https://github.com/lucassenarj/application-tracker/commit/57d8c0349741616a2d7e850a39114801c4169471))
* **frontend:** apply Clean Slate visual theme ([4f0dd2b](https://github.com/lucassenarj/application-tracker/commit/4f0dd2b28b830f459bf347782c5d9adb6c256f94))
* **frontend:** redesign authenticated layout as sidebar + header ([9809ce9](https://github.com/lucassenarj/application-tracker/commit/9809ce9aba74f2b2d7e7b61618d722f252b42a3f))
* **frontend:** send selected company id on application create ([63a8cb4](https://github.com/lucassenarj/application-tracker/commit/63a8cb412b7615e2d07572423722911d6a17f312))
* **identity:** add Profile page for editing name/avatar ([21a6f44](https://github.com/lucassenarj/application-tracker/commit/21a6f449c5c5be4cc5e788fcb4e7e6507f2f3420))
* **identity:** redesign Profile page as a view/edit split ([3d905f7](https://github.com/lucassenarj/application-tracker/commit/3d905f702131d87a9616364954062430912aed19))

# frontend-v1.0.0 (2026-09-19)


### Bug Fixes

* **frontend:** generate routeTree.gen.ts before typechecking in CI ([a1a3e4f](https://github.com/lucassenarj/application-tracker/commit/a1a3e4f0c564da86bf8752200e015f015c00e6d2))


### Features

* **frontend:** add auth-check guard and login/dashboard routes ([5bd03b2](https://github.com/lucassenarj/application-tracker/commit/5bd03b22ab9fb0bd24bc0bf1f7b2f0286aea0edc))
* **frontend:** add typed API client with CSRF handling ([cf7657f](https://github.com/lucassenarj/application-tracker/commit/cf7657f85f3ab746af63ba7a720d0cf189b3a14f))
* **frontend:** scaffold routing, query, and UI foundation ([a84c943](https://github.com/lucassenarj/application-tracker/commit/a84c94398d4481b6d8a272ec1644950384092f65))
