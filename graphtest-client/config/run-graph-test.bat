@echo off
title run driver server
{$pathCmds} & mocha -t 6000 recordResult.js > run.log && exit
exit
