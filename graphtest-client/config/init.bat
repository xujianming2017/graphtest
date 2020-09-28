@echo off
echo init starting ... > init.log
if exist node_modules (echo delete folder node_modules starting ... >> init.log && rd /s /q "node_modules" >> init.log && echo delete folder node_modules finished. >> init.log && echo . >> init.log) 
npm install mocha -g >> init.log && npm install selenium-standalone@latest -g >> init.log && selenium-standalone install >> init.log &&  npm install >> init.log && echo init finished. >> init.log
exit