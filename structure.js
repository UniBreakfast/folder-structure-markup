const fs = require('fs')
const { resolve, sep } = require('path')

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
  const struct1 = structure(tree1)
  console.log(struct1, '\n')
  // └─📄file
}

{
  const tree2 = {
    name: 'folder',
    children: [],
  }
  const struct2 = structure(tree2)
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
  const struct3 = structure(tree3)
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
  const struct4 = structure(tree4)
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
  const struct5 = structure(tree5)
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

  const struct6 = structure(tree6)
  console.log(struct6, '\n')
  // ├─📁folder
  // │ └─📁subfolder1
  // │   └─📁subfolder2
  // │     └─📁subfolder3
  // │       └─📄file1
  // └─📄file2
}

function structure(tree, last = true, depth = [0]) {
  const icon = tree.children ? '📁' : '📄'
  const line = last ? '└' : '├'

  let result = `${line}─${icon}${tree.name}`

  if (tree.children) {
    tree.children.forEach((child, i, arr) => {
      const last = i === arr.length - 1
      const indent = depth.map(line => line ? '│  ' : '   ').join('')
      result += '\n' + indent + structure(child, last, [...depth, !last])
    })
  }
  return result
}

/* 
Create folders and empty files according to the structure
*/

function createStructure(tree, path = '.') {
  const { name, children } = tree
  const dir = path + '/' + name
  if (children) {
    try {
      fs.mkdirSync(dir)
    } catch { }
    children.forEach(child => {
      try {
        createStructure(child, dir)
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
  createStructure(tree6)
}

/*
Create a structure from a directory
*/

function getStructure(path = '.', ignore = []) {
  path = resolve(path)
  const name = path.split(sep).pop()
  const isFolder = fs.lstatSync(path).isDirectory()
  const tree = { name }
  if (isFolder) {
    tree.children = fs.readdirSync(path)
      .filter(child => !ignore.includes(child))
      .map(child => getStructure(path + sep + child))
      .sort((a, b) => a.children && !b.children ? -1 : !a.children && b.children ? 1 : 0)
  }
  return tree
}

{
  const struct = structure(getStructure())
  console.log(struct, '\n')
}

{
  const ignore = ['node_modules', '.git']
  const struct = structure(getStructure('.', ignore))
  console.log(struct, '\n')
}
