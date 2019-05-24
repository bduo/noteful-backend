const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersServices = require('./folders-services')

const foldersRouter = express.Router()
const jsonParser = express.json()

const sanitizeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

foldersRouter.route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersServices.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(sanitizeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { name } = req.body
        const newFolder = { name }

        for (const [key, value] of Object.entries(newFolder)) {
            if (value === null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        // newFolder.name = name
        FoldersServices.insertFolder(knexInstance, newFolder)
            .then(folder => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(sanitizeFolder(folder))
            })
        .catch(next)
    })

foldersRouter.route('/:folder_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const folderId = req.params.folder_id

        FoldersServices.getById(knexInstance, folderId)
            .then(folder => {
                if (!folder) {
                    return res.status(404),json({
                        error: { message: `Folder doesn't exist` }
                    })
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(sanitizeFolder(res.folder))
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const folderId = req.params.folder_id
        const { name } = req.body
        const folderToUpdate = { name }

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body is empty`
                }
            })
        }

        FoldersServices.updateFolder(knexInstance, folderId, folderToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const folderId = req.params.folder_id

        FoldersServices.deleteFolder(knexInstance, folderId)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter