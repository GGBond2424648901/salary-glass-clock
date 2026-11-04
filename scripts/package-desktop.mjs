import {packager} from '@electron/packager';
import fs from 'node:fs';
const {version}=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const output=await packager({dir:'.',name:'SalaryClock',platform:'win32',arch:'x64',out:'release',overwrite:true,asar:true,icon:'desktop/icon.ico',appVersion:version,win32metadata:{CompanyName:'Salary Glass Clock',FileDescription:'上班攒钱钟',ProductName:'上班攒钱钟',InternalName:'SalaryClock'},ignore:[/^\/\.git($|\/)/,/^\/\.github($|\/)/,/^\/release($|\/)/,/^\/docs($|\/)/,/^\/tests($|\/)/,/^\/scripts($|\/)/,/^\/node_modules($|\/)/,/^\/package-lock\.json$/]});
console.log(output.join('\n'));
