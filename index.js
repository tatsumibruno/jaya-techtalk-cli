#!/usr/bin/env node

const { Command } = require("commander");
const package = require('./package.json');
const figlet = require('figlet');
const chalk = require("chalk");
const fs = require('fs');
const csvParser = require("csv-parser");
const { default: axios } = require("axios");
const inquirer = require("inquirer");

console.log(chalk.green(figlet.textSync('Tech Talk CLI')));

const program = new Command();
program.version(package.version);
program.command('import')
  .description('Ler arquivo CSV e importar na API de usuários')
  .argument('file', 'Caminho do arquivo CSV')
  .action(file => {
    const users = [];
    fs.createReadStream(file)
      .pipe(csvParser())
      .on('data', item => users.push(item))
      .on('end', () => {
        Promise
          .all(users.map(user => axios.post('http://localhost:8080/users', user)))
          .then(() => console.log('Usuários importados'));
      });
  });
program.command('delete')
  .description('Deletar usuários')
  .action(async() => {
    const response = await axios.get('http://localhost:8080/users');
    const users = response.data;
    inquirer.prompt([{
      name: 'emails',
      type: 'checkbox',
      choices: users.map(u => u.email)
    }])
    .then(answer => {
      const emails = answer.emails;
      Promise.all(users
        .filter(u => emails.indexOf(u.email) != -1)
        .map(u => u.id)
        .map(id => axios.delete('http://localhost:8080/users/' + id)))
        .then(() => chalk.blue(console.log('Usuários deletados')));
    });
  });
program.parse(process.argv);