const fs = require('fs')
const { readdirSync } = require('fs')
const { resolve, sep, parse, join } = require('path')

/* 
function takes an object (tree) describing a directory structure like this:
{
  name: 'folder',
  children: [
    {
      name: 'subfolder1',
      children: [
        { name: 'file1' },
        { name: 'file2' },
      ],
    },
    {
      name: 'subfolder2',
      children: [
        { name: 'file3' },
        { name: 'file4' },
      ],
    },
    {
      name: 'subfolder3',
      children: [],
    },
    { name: 'file5' },
  ],
}
and returns a string representing the structure like this:
└─📁folder
  ├─📁subfolder1
  │ ├─📄file1
  │ └─📄file2
  ├─📁subfolder2
  │ ├─📄file3
  │ └─📄file4
  ├─📁subfolder3
  └─📄file5
*/

{
  const tree1 = {
    name: 'file',
  }
  const struct1 = stringifyDirStructure(tree1)
  console.log(struct1, '\n')
  // └─📄file
}

{
  const tree2 = {
    name: 'folder',
    children: [],
  }
  const struct2 = stringifyDirStructure(tree2)
  console.log(struct2, '\n')
  // └─📁folder
}

{
  const tree3 = {
    name: 'folder',
    children: [
      { name: 'file' },
    ],
  }
  const struct3 = stringifyDirStructure(tree3)
  console.log(struct3, '\n')
  // └─📁folder
  //   └─📄file
}

{
  const tree4 = {
    name: 'folder',
    children: [
      {
        name: 'subfolder1',
        children: [
          { name: 'file1' },
          { name: 'file2' },
        ],
      },
    ],
  }
  const struct4 = stringifyDirStructure(tree4)
  console.log(struct4, '\n')
  // └─📁folder
  //   └─📁subfolder1
  //     ├─📄file1
  //     └─📄file2
}

{
  const tree5 = {
    name: 'folder',
    children: [
      {
        name: 'subfolder1',
        children: [
          { name: 'file1' },
        ],
      },
      {
        name: 'subfolder2',
        children: [],
      },
    ],
  }
  const struct5 = stringifyDirStructure(tree5)
  console.log(struct5, '\n')
  // └─📁folder
  //   ├─📁subfolder1
  //   │ └─📄file1
  //   └─📁subfolder2
}

{
  const tree6 = {
    name: 'folder',
    children: [
      {
        name: 'subfolder1',
        children: [
          {
            name: 'subfolder2',
            children: [
              {
                name: 'subfolder3',
                children: [
                  { name: 'file1' },
                ],
              },
            ],
          },
        ],
      },
      { name: 'file2' },
    ],
  }

  const struct6 = stringifyDirStructure(tree6)
  console.log(struct6, '\n')
  // ├─📁folder
  // │ └─📁subfolder1
  // │   └─📁subfolder2
  // │     └─📁subfolder3
  // │       └─📄file1
  // └─📄file2
}

function stringifyDirStructure(tree, last = true, depth = [0]) {
  const icon = tree.children ? '📁' : '📄'
  const line = last ? '└' : '├'

  let result = `${line}─${icon}${tree.name}`

  if (tree.children) {
    tree.children.forEach((child, i, arr) => {
      const last = i === arr.length - 1
      const indent = depth.map(line => line ? '│  ' : '   ').join('')
      result += '\n' + indent + stringifyDirStructure(child, last, [...depth, !last])
    })
  }
  return result
}

/* 
Create folders and empty files according to the structure
*/

function makeDirStructure(tree, path = '.') {
  const { name, children } = tree
  const dir = path + '/' + name
  if (children) {
    try {
      fs.mkdirSync(dir)
    } catch { }
    children.forEach(child => {
      try {
        makeDirStructure(child, dir)
      } catch { }
    })
  }
  else {
    try {
      fs.writeFileSync(dir, '')
    } catch { }
  }
}

{
  const tree6 = {
    name: 'folder',
    children: [
      {
        name: 'subfolder1',
        children: [
          {
            name: 'subfolder2',
            children: [],
          },
          {
            name: 'subfolder3',
            children: [
              { name: 'file1' },
              { name: 'file2' },
            ],
          },
        ],
      },
      { name: 'file3' },
    ],
  }
  makeDirStructure(tree6)
}

/*
Create a structure from a directory
*/

function readDirStructure(path = '.', ignore = []) {
  path = resolve(path)
  const name = path.split(sep).pop()
  const isFolder = fs.lstatSync(path).isDirectory()
  const tree = { name }
  if (isFolder) {
    tree.children = fs.readdirSync(path)
      .filter(child => !ignore.includes(child))
      .map(child => readDirStructure(path + sep + child))
      .sort((a, b) => !a.children - !b.children)
  }
  return tree
}

function readDirStructure(path = '.', ignore = []) {
  path = resolve(path)

  const name = path.split(sep).pop()
  const isFolder = fs.lstatSync(path).isDirectory()
  const tree = { name }

  if (isFolder) {
    tree.children = fs.readdirSync(path)
      .filter(isWorthReading)
      .map(readDeeper)
      .sort(childfreeLast)
      .x
  }

  return tree

  function isWorthReading(child) {
    return !ignore.includes(child)
  }

  function readDeeper(child) {
    return readDirStructure(path + sep + child)
  }

  function childfreeLast(a, b) {
    return !a.children - !b.children
  }
}

function readDirStructure(path = '.', skipNames = []) {
  const { name, folder, childPaths } = readEnt(path, skipNames)
  const tree = { name }

  if (folder) {
    tree.children = childPaths
      .map(path => readDirStructure(path, skipNames))
      .sort(foldersFirst).x
  }

  return tree
}

function readEnt(path, skipNames) {
  const realPath = resolve(path)
  const pathChunks = realPath.split(sep)
  const name = pathChunks.pop()
  const stats = fs.lstatSync(path)
  const folder = stats.isDirectory()

  let childPaths = null

  if (folder) {
    childPaths = []

    const allNames = fs.readdirSync(path)

    for (const name of allNames) {
      if (!skipNames.includes(name)) {
        childPaths.push(path + sep + name)
      }
    }
  }

  return { name, folder, childPaths }
}


function readEnt(path, skipNames) {
  const name = resolve(path).split(sep).pop()
  const folder = fs.lstatSync(path).isDirectory()
  const childPaths = !folder ? null : fs.readdirSync(path)
    .filter(child => !skipNames.includes(child)).x
    .map(child => path + sep + child)

  return { name, folder, childPaths }
}

function readEnt(path, skipNames) {
  const realPath = resolve(path)
  const pathChunks = realPath.split(sep)
  const name = pathChunks.pop()
  const stats = fs.lstatSync(path)
  const folder = stats.isDirectory()

  let childPaths = null

  if (folder) {
    childPaths = []

    const allNames = fs.readdirSync(path)

    for (const name of allNames) {
      if (!skipNames.includes(name)) {
        childPaths.push(path + sep + name)
      }
    }
  }

  return { name, folder, childPaths }
}

function readDirStructure(path = '.', skipNames = []) {
  const { dir, base } = parse(resolve(path))

  return makeReader(skipNames)(dir, base, skipNames)
}

function makeReader(skipNames) {
  const skippingIgnored = filterOut(skipNames)

  return function readFn(dir, name) {
    const ent = { name }

    try {
      const path = join(dir, name)
      const allNames = readdirSync(path)
      const someNames = allNames.filter(skippingIgnored)
      const children = someNames.map(by(path, readFn))

      ent.children = children.sort(foldersFirst)
    } catch { }

    return ent
  }
}

function filterOut(skipNames) {
  return function (name) {
    return !skipNames.includes(name)
  }
}

function by(path, readFn) {
  return function (name) {
    return readFn(path, name)
  }
}

function foldersFirst(a, b) {
  return !a.children - !b.children
}


{
  const struct = stringifyDirStructure(readDirStructure())
  console.log(struct, '\n')
}

{
  const ignore = ['node_modules', '.git']
  const struct = stringifyDirStructure(readDirStructure('.', ignore))
  console.log(struct, '\n')
}
