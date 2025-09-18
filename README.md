# Stripes Hub

Copyright (C) 2016-2025 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

stripes-hub orchestrates UI modules in a module federation setup, conducting the following before handing the reins to Stripes (er, stripes-core): 
* read static tenant configuration values
* receieve the callback from the authentication provider and exchange the one-time-code for cookies
* determine whether a session has already been established
* conduct a discovery/entitlement request
* load stripes

## See also

* [stripes](https://www.github.com/folio-org/stripes)
* [stripes-core](https://www.github.com/folio-org/stripes-core)


## Additional information

See project [STHUB](https://folio-org.atlassian.net/jira/software/c/projects/STHUB/summary)
at the [FOLIO issue tracker](https://folio-org.atlassian.net/jira).

Other FOLIO Developer documentation is at [dev.folio.org](https://dev.folio.org/)

