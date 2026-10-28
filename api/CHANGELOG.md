# [api-v1.12.4](https://github.com/lucassenarj/application-tracker/compare/api-v1.12.3...api-v1.12.4) (2026-10-28)


### Bug Fixes

* **identity:** accept a required name field on registration ([7fff565](https://github.com/lucassenarj/application-tracker/commit/7fff5658c9b2e2c7b90035ff9afc1b43583d9dd9))
* **identity:** add a remember-me option to login ([9aba8c2](https://github.com/lucassenarj/application-tracker/commit/9aba8c26c501bf810d4e5d993b196f4b01b80117))

# [api-v1.12.3](https://github.com/lucassenarj/application-tracker/compare/api-v1.12.2...api-v1.12.3) (2026-10-27)


### Bug Fixes

* **identity:** bind CSRF tokens to the access token so refresh requests pass validation ([3b3dbd0](https://github.com/lucassenarj/application-tracker/commit/3b3dbd02272ffee91f5643637ce3d0eb148d2a67))

# [api-v1.12.2](https://github.com/lucassenarj/application-tracker/compare/api-v1.12.1...api-v1.12.2) (2026-10-27)


### Bug Fixes

* **application:** add a month-scoped interviews endpoint, including past interviews ([3ae4264](https://github.com/lucassenarj/application-tracker/commit/3ae4264e26ab23ffa291d5ca1906608dbd1f7a23))

# [api-v1.12.1](https://github.com/lucassenarj/application-tracker/compare/api-v1.12.0...api-v1.12.1) (2026-10-27)


### Bug Fixes

* **application:** exclude future-dated status changes from Recent Activity ([65775a2](https://github.com/lucassenarj/application-tracker/commit/65775a2dd293443c632636ad519f95f75895addc))

# [api-v1.12.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.11.0...api-v1.12.0) (2026-10-27)


### Features

* **application:** add a Recent Activity status-change feed endpoint ([401224d](https://github.com/lucassenarj/application-tracker/commit/401224d12ce9f2548c7e290b4053cf82261ef38f))
* **application:** add applications-over-time and upcoming-interviews endpoints ([fe0ba2f](https://github.com/lucassenarj/application-tracker/commit/fe0ba2fa5b344a1c4b83aaeb90e459ad07479b50))

# [api-v1.11.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.10.0...api-v1.11.0) (2026-10-26)


### Features

* **identity:** add an optional defaultCurrency user preference ([8b36341](https://github.com/lucassenarj/application-tracker/commit/8b363412bde7ae1f35f0a8a73970d1b55c3389a7))

# [api-v1.10.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.9.0...api-v1.10.0) (2026-10-25)


### Features

* **application:** add an optional currency field to applications ([432fb14](https://github.com/lucassenarj/application-tracker/commit/432fb141a1e34e82cf028cc2535cf666a44f06c6))
* **identity:** add optional phone, bio, and language fields to user profiles ([1905507](https://github.com/lucassenarj/application-tracker/commit/1905507445bf245d021b0142a30b42f96f64b806))

# [api-v1.9.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.8.0...api-v1.9.0) (2026-10-24)


### Features

* **application:** expose the latest status-change date on the applications list ([3b31916](https://github.com/lucassenarj/application-tracker/commit/3b319163c2922e3c5b21146ff797dd0297bfc9f4))

# [api-v1.8.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.7.0...api-v1.8.0) (2026-10-02)


### Features

* **application:** add availableTransitions to the applications list response ([a258600](https://github.com/lucassenarj/application-tracker/commit/a2586005ace4d17010151c81eec15b710a19fb5c))

# [api-v1.7.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.6.0...api-v1.7.0) (2026-10-02)


### Features

* **application:** add category filter to GET /applications ([0920a63](https://github.com/lucassenarj/application-tracker/commit/0920a636aa39e37236effa25766b4c22474f9fc8))

# [api-v1.6.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.5.0...api-v1.6.0) (2026-10-01)


### Features

* **application:** expose available status transitions and fix Swagger response schemas ([9965391](https://github.com/lucassenarj/application-tracker/commit/99653915934ae0f9c5372592d264645b3aea6253))

# [api-v1.5.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.4.0...api-v1.5.0) (2026-10-01)


### Features

* **application:** include company name and status history in GET /applications/:id ([28a6445](https://github.com/lucassenarj/application-tracker/commit/28a6445992a77a7979b2a10a84bd2900e89cb49c))

# [api-v1.4.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.3.0...api-v1.4.0) (2026-09-30)


### Features

* **application:** resolve company by id when creating an application ([9064188](https://github.com/lucassenarj/application-tracker/commit/906418879df42a2ad66e53208df0b0449f5743e6))

# [api-v1.3.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.2.0...api-v1.3.0) (2026-09-21)


### Bug Fixes

* **applications:** remove unnecessary company field from PersistedApplication type ([fb7f889](https://github.com/lucassenarj/application-tracker/commit/fb7f889b5b8e77deeda0fa456549aea67f3cfd25))


### Features

* **applications:** include company name in the applications list response ([245d788](https://github.com/lucassenarj/application-tracker/commit/245d788ced2f083d3b01b982fad6ab3a77081608))

# [api-v1.2.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.1.0...api-v1.2.0) (2026-09-20)


### Features

* **applications:** add dashboard stats endpoint ([25a01da](https://github.com/lucassenarj/application-tracker/commit/25a01da8e70ef6e9d4fc60c4b7bb44f88a10691c))

# [api-v1.1.0](https://github.com/lucassenarj/application-tracker/compare/api-v1.0.0...api-v1.1.0) (2026-09-18)


### Bug Fixes

* **applications:** sort findAllByUser by most recently created first ([d1888f1](https://github.com/lucassenarj/application-tracker/commit/d1888f1311c8a246946391189ed7bcfb3f1cdf3d))
* **identity:** stop leaking role/isActive/authProvider in UserResponse ([682eefa](https://github.com/lucassenarj/application-tracker/commit/682eefa2a7522039609b7ff7672cdee5923c4125))


### Features

* **applications:** add company search endpoint ([0871f81](https://github.com/lucassenarj/application-tracker/commit/0871f813034b75bd0c88da34280873f2fb39395e))
* **applications:** full-text search and status filter on findAllByUser ([d5b0429](https://github.com/lucassenarj/application-tracker/commit/d5b04293ea4084f7f938328ee0b47042284afdbf))
* **applications:** paginate findAllByUser ([9295de4](https://github.com/lucassenarj/application-tracker/commit/9295de4fdc3721349c941be022f5ef036894740e))
* **identity:** add profile view/update endpoint ([9a52593](https://github.com/lucassenarj/application-tracker/commit/9a52593aea8240f211846f319e03dd43829ec6c6))

# api-v1.0.0 (2026-09-17)


### Bug Fixes

* **api:** copy prisma7.config.ts into the production image ([2cdd3eb](https://github.com/lucassenarj/application-tracker/commit/2cdd3eb1205f20a7c38a55c6692b81fb54c10a66))
* **api:** include prisma/ in the production image ([29c5160](https://github.com/lucassenarj/application-tracker/commit/29c5160bd5bb14bbd21bf02e00e1cce6dc0226f5))
* **api:** run migrations on container start instead of Render's pre-deploy command ([417dfec](https://github.com/lucassenarj/application-tracker/commit/417dfecf6a769fc08e0b614c93cbf5f388ab4a68))
* **application:** resolve lint errors (prettier formatting, unused stub params) ([f993403](https://github.com/lucassenarj/application-tracker/commit/f9934033d95b6db00fe1a64ec19b08d90b1649e4))
* **applications:** assert generated companyId is non-empty ([885ca7f](https://github.com/lucassenarj/application-tracker/commit/885ca7fd72665e3f54d537879d607a562bab7d6f))
* **ci:** fix Postgres 18 volume mount and Prisma OpenSSL detection ([4c4bb67](https://github.com/lucassenarj/application-tracker/commit/4c4bb67d216a1acccce08353e83a4442cff94d57))
* **identity:** map AuthService errors to proper HTTP exceptions ([d935930](https://github.com/lucassenarj/application-tracker/commit/d9359308e7622f3334b03e8e189f84df60961765))
* **infrastructure:** coalesce interviewCategory null to undefined] ([1b58f03](https://github.com/lucassenarj/application-tracker/commit/1b58f0386b6867ff778652fad081c817a69559a4))
* **infrastructure:** fix dist/main.js path by relocating generated Prisma client ([9541bf4](https://github.com/lucassenarj/application-tracker/commit/9541bf4387507c3a5c2f3b230ccbf705f8870408))
* **infrastructure:** serialize integration tests to avoid cross-file DB races ([d40364b](https://github.com/lucassenarj/application-tracker/commit/d40364b385b211226aeff84e2c941138d18851c5))


### Features

* **api:** enable CORS for the frontend origin ([069e8a4](https://github.com/lucassenarj/application-tracker/commit/069e8a4d26ac300e7342782698ea6cb2c8f445f9))
* **application-tracker:** implement APPLIED entry-only rule for status state machine ([c14b199](https://github.com/lucassenarj/application-tracker/commit/c14b1995cdfaff3de77fc467de9be9f697553048))
* **application-tracker:** implement full status transition rules for state machine ([58c5cc7](https://github.com/lucassenarj/application-tracker/commit/58c5cc76703627a639687b89bf7f7936a1434c64))
* **application:** add changeStatus transition method ([bfc97b5](https://github.com/lucassenarj/application-tracker/commit/bfc97b5a4b16f6d2b9e5ce473d6c8b230b6dbdb5))
* **application:** add request DTOs with class-validator ([f5a4c27](https://github.com/lucassenarj/application-tracker/commit/f5a4c2714c118f1517b8234b21b52e0d07fa7241))
* **application:** implement Application aggregate construction and invariants ([d708847](https://github.com/lucassenarj/application-tracker/commit/d70884700507b0c37e8d92a7b7396174530d5c20))
* **application:** implement Application aggregate construction and invariants ([8b5e319](https://github.com/lucassenarj/application-tracker/commit/8b5e3193727defcfc43e84daa204f2694727e7e9))
* **application:** implement StatusChange construction and invariants ([a74a5c5](https://github.com/lucassenarj/application-tracker/commit/a74a5c50078a01b36b4a00521a295a0bebb4bb8b))
* **applications:** require authentication and enforce ownership ([ccc1196](https://github.com/lucassenarj/application-tracker/commit/ccc1196b0c085d452358cf0c4d7a95b902868efb))
* **application:** wire ApplicationsController to the real service ([6ca2395](https://github.com/lucassenarj/application-tracker/commit/6ca239527b37878944eda47e88d4e18949dbe5e4))
* **application:** wire ApplicationsService.create to real repositories ([9398cde](https://github.com/lucassenarj/application-tracker/commit/9398cded88d8ed33576d1f856d814cd66f5f75e0))
* **application:** wire ApplicationsService.findAllByUser to the real repository ([ea77d0a](https://github.com/lucassenarj/application-tracker/commit/ea77d0ade2153383ad8ca24b4bac1ba81cd54a61))
* **application:** wire ApplicationsService.findById and changeStatus to real repositories ([ad37a02](https://github.com/lucassenarj/application-tracker/commit/ad37a02a000c63ab63fcd582847b614e298e669d))
* **identity:** add AuthController with register, login, refresh, and logout endpoints ([25ffaa5](https://github.com/lucassenarj/application-tracker/commit/25ffaa5cf939a17e62395068d076f3af916d2710))
* **identity:** add AuthService with register, login, refresh, and logout ([c8eedb1](https://github.com/lucassenarj/application-tracker/commit/c8eedb10ce81a23b908656140af8f892b41114cb))
* **identity:** add JwtAuthGuard for verifying the access token cookie ([5ff7347](https://github.com/lucassenarj/application-tracker/commit/5ff7347f622b07be04e417f467c4eb7f44f4fd7f))
* **identity:** add Prisma schema and PrismaUserRepository ([6dc2641](https://github.com/lucassenarj/application-tracker/commit/6dc26410da367941357eb15f271a0e70107d4f68))
* **identity:** add RefreshToken.revoke domain method ([f401c74](https://github.com/lucassenarj/application-tracker/commit/f401c741f58e96c1afed54330ddd2b84f74461c6))
* **identity:** add RefreshTokenRepository and Prisma implementation ([95af947](https://github.com/lucassenarj/application-tracker/commit/95af947b959c9f23221e1641ad0765c944434737))
* **identity:** add User.reconstitute and Argon2id password hashing ([08cfcfc](https://github.com/lucassenarj/application-tracker/commit/08cfcfc3c8b49e5b3a7a333c7111a18e4f835664))
* **identity:** implement RefreshToken domain entity construction under TDD ([21435ce](https://github.com/lucassenarj/application-tracker/commit/21435cee91904b17c5d5f040103c1d45f951168a))
* **identity:** implement User domain entity construction under TDD ([6166e92](https://github.com/lucassenarj/application-tracker/commit/6166e920ca54d8fbe9b65ca77b6f759f3bd7e05f))
* **identity:** wire IdentityModule into the app ([84d5d58](https://github.com/lucassenarj/application-tracker/commit/84d5d58f2239a7c4e3c0cf55906efe60ad6c3a70))
* **infrastructure:** add Prisma schema and repository implementations ([f06839a](https://github.com/lucassenarj/application-tracker/commit/f06839abe1063d06ae37cc930ddbdc5c79f8004f))
* **infrastructure:** add production Dockerfile for api ([2e0467c](https://github.com/lucassenarj/application-tracker/commit/2e0467c1b04e33f5b495be60145fc2f2c3255690))
* **infrastructure:** implement PrismaApplicationRepository.findAllByUser ([36793d6](https://github.com/lucassenarj/application-tracker/commit/36793d6fb49d6e076c1f21c81b7bc3017b6af818))
* **security:** add CSRF double-submit token protection ([93c82da](https://github.com/lucassenarj/application-tracker/commit/93c82dafb348d1edbfd46fb12cb14e1a621e600d))
