@echo off
title run graph test
selenium-standalone start | start /wait call run-graph-test.bat
exit
