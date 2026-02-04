# Stripes Hub

Copyright (C) 2016-2026 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

stripes-hub orchestrates UI modules in a [module federation](https://webpack.js.org/concepts/module-federation/)
setup. It is a thin layer responsible for reading static tenant data (such as
the name of the tenant and the URLs for its gateway and authentication
providers), and fetching dynamic data (such as the user's permissions and
the tenant's entitled applications and their locations) before handing the
reins to Stripes. The basic steps are:

* read static tenant configuration values
* inspect localstorage to see if a session has already been established,
  attempting to make an API call to _self if so, or manage the handoff to/from
  the authentication provider, on the return exchanging its one-time-code for
  cookies and making the API call to _self
* make an API call to retrieve the tenant's entitlement information
* make an API call to retrieve discovery details for entitled modules,
  including stripes itself
* load Stripes

## See also

* [stripes](https://www.github.com/folio-org/stripes)
* [stripes-core](https://www.github.com/folio-org/stripes-core)

## Additional information

See project [STHUB](https://folio-org.atlassian.net/jira/software/c/projects/STHUB/summary)
at the [FOLIO issue tracker](https://folio-org.atlassian.net/jira).

Other FOLIO Developer documentation is at [dev.folio.org](https://dev.folio.org/)

