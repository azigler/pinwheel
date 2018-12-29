Login event flow
==
```
                 intro (MotD)
                        |
1                  /- login -\
                  /           \
2       create-account       password  
              |                   \
3       set-password ------------ menu ---------------------T--------------------\
              |                     \              (character roster)             \
4      confirm-password        create-character             |            deactivate-character  
                                     |                      |
5                               confirm-name                |
                                     |                      |  
6                             choose-aspect (x3)            |
                                     |                      |
7                              confirm-gender               |
                                     |                      |
8                             choose-description            |
                                     |                      |
9                              review-character             |
                                     |                      |
                                      \------- done -------/
                                                |
                                               loop  
```