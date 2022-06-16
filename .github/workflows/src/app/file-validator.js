const actionEvent = require('./action-event.js');
const path = require('path')
const yaml = require('yaml')
const md = require('markdown-it')

const pullAuthor = actionEvent.pull.user.login
const expectedPath = `_messages`
const characterLimits = { user: 28, time: 30, quote: 100 }

class FileVaidator {
  constructor() {

  }

  async isMarkdownValid(markdown) {
    // hack to import a module TOO Enable modules and swap all the requires
    const metadataBlock = (await import("markdown-it-metadata-block")).default;
    const meta = {}
    const errors = []
    let mdContent = false

    const mdParser = md({
      html: true,
      linkify: true,
      typographer: true
    }).use(metadataBlock,{
      parseMetadata: yaml.parse,
      meta: meta
    });

    try {
     mdContent = mdParser.render(markdown)
    } catch(err) {
      console.log("markdown error: " + err)
      errors.push(`*The markdown content in \`${expectedPath}/${pullAuthor}.md\` has syntax errors*`)
    }

    if(mdContent !== false) {
      // user validation
      /*if(meta.github_user !== pullAuthor) {
        errors.push(`*The yaml content in \`${expectedPath}/${pullAuthor}.md\` must contain your github username*`)
      }*/
      for(const key of [ "time" ]) {
        if(!meta[key]) {
          errors.push(`*The attribute time is required in \`${expectedPath}/${pullAuthor}.md\`*`)
        }
        if(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.test(meta[key])){
          errors.push(`*The attribute time need to be in the format: YYYY-MM-DD HH:MM:SS. For example: 2022-06-15 17:01:10*`)
        }
        if (new Date(meta[key]) < new Date()){
          errors.push(`*You can't a time in the future.*`)
        }
      }
      for(const key of [ "user", "time", "quote"]) {
        if(!meta[key]) {
          errors.push(`*The attribute \`${key}\` is required in \`${expectedPath}/${pullAuthor}.md\`*`)
        } else if(meta[key].length > characterLimits[key]) {
          errors.push(`*The value for \`${key}\` can only have **${characterLimits[key]}** characters max (I see **${meta[key].length }**)*`)
        }
      }
    } else {
      errors.push(`*\`${expectedPath}/${pullAuthor}.md\` does not contain any yaml metadata*`)
    }

    return { isValid: !errors.length, errors: errors }
  }

  isValidPaths(filePaths=[]) {
    console.log(pullAuthor)
    const errors = []
    const invalidPaths = []
    let invalidDirectory = false
    let InvalidMarkdownFile = true
    let isValid = true
    let pathData

    for(let filePath of filePaths) {
      pathData = path.parse(filePath)

      if(pathData.dir !== expectedPath) {
        invalidPaths.push("`" + filePath + "`")
        invalidDirectory = true
      }

      if(pathData.base === `${pullAuthor}.md`) {
        InvalidMarkdownFile = false
      }
    }

    if(InvalidMarkdownFile) {
      errors.push(`*The required markdown file does not exist, please ensure the file \`${expectedPath}/${pullAuthor}.md\` exists*`)
    }

    if(invalidDirectory) {
      errors.push(`*Please ensure all changes are contained within the \`${expectedPath}/\` directory. Invalid file paths:* \n\n\t* ${invalidPaths.join('\n\t* ')}\n`)
    }

    return { isValid: !errors.length, errors }
  }
}

module.exports = new FileVaidator()
