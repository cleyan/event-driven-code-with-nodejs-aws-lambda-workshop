# event-driven-code-with-nodejs-aws-lambda-workshop

## slides
https://slides.com/jpizarrom/event-driven-code-with-nodejs-aws-lambda-workshop

# Lab 0: Deps
    nvm
        https://github.com/creationix/nvm#install-script
            curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.6/install.sh | bash
            nvm install v4.3.1
            nvm use v4.3.1

    serverless
        npm install serverless@0.5.0

    deps
        npm install


## init
### AWS cred

### project init
    change s-project.json name to customname
    ./node_modules/.bin/serverless project init -c -n customname
    ./node_modules/.bin/serverless resources deploy
    ./node_modules/.bin/serverless function deploy


## get and conf mercadopublicoTicket api key
    http://api.mercadopublico.cl/modules/api.aspx
    http://api.mercadopublico.cl/modules/ejemplo_08.aspx

    add var mercadopublicoTicket in _meta/variables/s-variables-common.json
    {
        "project": "customname",
        "mercadopublicoTicket": "xxxxxxx"
    }

# Lab 1: collector-download_detail, functions and deps
    cd collector/download_detail && npm install && cd ../..
    ./node_modules/.bin/serverless function deploy collector-download_detail

## run
    ./node_modules/.bin/serverless function run collector-download_detail

## events
    ./node_modules/.bin/serverless event deploy

# Post Lab: Remove resources

# Functions

    collector
        download_list
        list_stream_processor
        download_detail
    detector
        detail_stream_processor
        detector
    notificator
        notificator
    elastic
        elastic

# Info
    https://serverless.readme.io/docs/project-structure
