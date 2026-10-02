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
