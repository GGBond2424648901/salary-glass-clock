import {packager} from '@electron/packager';
const output=await packager({dir:'.',name:'SalaryClock',platform:'win32',arch:'x64',out:'release',overwrite:true,asar:true,icon:'desktop/icon.ico',appVersion:'1.1.0',win32metadata:{CompanyName:'Salary Glass Clock',FileDescription:'上班攒钱钟',ProductName:'上班攒钱钟',InternalName:'SalaryClock'},ignore:[/^\/\.git($|\/)/,/^\/\.github($|\/)/,/^\/release($|\/)/,/^\/docs($|\/)/,/^\/tests($|\/)/,/^\/scripts($|\/)/,/^\/node_modules($|\/)/,/^\/package-lock\.json$/]});
console.log(output.join('\n'));
