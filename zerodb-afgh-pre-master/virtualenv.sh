#!/bin/bash

if [ ! -d ".tox" ]
then
    if [ ! -e "$(which virtualenv)" ]
    then
        echo "You need to install virtualenv"
        echo "Please do:"
        echo "  sudo pip install python-virtualenv"
    else
        # Get private dependencies
        mkdir -p deps
        pushd deps
        if [ ! -e "zerodb.tar" ]
        then
            git archive --format=tar --remote=git@bitbucket.org:zerodb/zerodb.git -o zerodb.tar -v master
        fi
        popd
        virtualenv .venv
        if [ ! -e "activate" ]
        then
            ln -s .venv/bin/activate .
        fi
        source activate
        pip install pytest
        python setup.py develop
    fi
else
    echo "All done already"
    echo "  source activate -- activate virtual environment"
    echo "  deactivate      -- leave virtual environment"
fi
