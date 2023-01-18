const fs = require('fs')
const path = require('path')
const https = require('https')
const HTMLParser = require('node-html-parser');
const emoji = require('node-emoji')

const baseUrl = ''
const baseUrlObj = new URL(baseUrl)

// add file types to observe/download here
const targetFileTypes = ['image', 'pdf', 'spreadsheet']

const getPage = pageUrl => {
    return new Promise((resolve, reject) => {
        https.get(pageUrl, res => {
            const data = []
    
            res.on('data', chunk => {
                data.push(chunk)
            })
            res.on('end', () => {
                resolve(Buffer.concat(data).toString())
            })
        })
    })
}

const checkIfDownloadable = async (urlToObserve) => {

    console.log(emoji.get("female-detective"), ' ',`Checking ${urlToObserve} for downloadable files...`);

    return new Promise((resolve,reject) => {
        https.get(urlToObserve, res => {
            let isDownloadable = false
            for (let targetFileType of targetFileTypes) {
                if(res.headers['content-type'].includes(targetFileType)) {
                    isDownloadable = true
                }   
            }
            resolve(isDownloadable)
        })
    })
}

const getDownloadUrls = async () => {
    const data = await getPage(baseUrl)
    const html = HTMLParser.parse(data)
    const urls = []

    console.log('\n');
    console.log(emoji.get("desktop_computer"), ' ', `Collecting all links found on ${baseUrl}...`);
    console.log('\n');
    
    for (const link of html.querySelectorAll('a')) {
        const href = link.getAttribute('href')
        
        if (href.length <= 1 || !href.startsWith('http') && !href.startsWith('/')) continue
        
        const urlToObserve = href.startsWith(baseUrlObj.protocol) ? href : `${baseUrlObj.origin}${href}` 
        const isFileUrl = await checkIfDownloadable(urlToObserve)
        
        if(isFileUrl) urls.push(urlToObserve)
    }
    console.log('\n');
    
    return urls
}

const downloadFromUrl = (url, destPath, fileName) => {
    https.get(url, res => {
        const filePath = fs.createWriteStream(destPath)
        res.pipe(filePath)
    })

    console.log(emoji.get("white_check_mark"), ' ', `${fileName} downloaded!`);
}

const createDownloadRequests = urls => {
    
    urls.forEach(url => {
        const urlObj = new URL(url)
        const urlSegments = urlObj.pathname.split('/')
        const fileName = urlSegments[urlSegments.length - 1]
        const destPath = path.join(__dirname, 'assets', `${fileName}`)
        downloadFromUrl(url, destPath, fileName)
    })
    
    console.log('\n');
    console.log(emoji.get("partying_face"), ' ', "\x1b[32m", 'Woohoo, all downloads completed!', ' ', emoji.get("champagne"));
    console.log('\n');
}

const downloadDataFromPage = async () => {
    try {
        const urls = await getDownloadUrls()
        createDownloadRequests(urls)
    } catch (error) {
        console.log(error);
    }
    
}

downloadDataFromPage()
