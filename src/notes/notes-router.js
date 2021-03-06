const path = require('path')
const express = require('express')
const xss = require('xss')
const NotesServices = require('./notes-services')

const notesRouter = express.Router()
const jsonParser = express.json()

const sanitizeNote = note => ({
    id: note.id,
    title: xss(note.title),
    date_modified: note.date_modified,
    folder_id: note.folder_id,
    content: xss(note.content)
})

notesRouter.route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        NotesServices.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(sanitizeNote))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { title, folder_id, content } = req.body
        const newNote = { title, folder_id, content }

        for (const [key, value] of Object.entries(newNote)) {
            if (value === null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        NotesServices.insertNote(knexInstance, newNote)
            .then(note => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(sanitizeNote(note))
            })
            .catch(next)
    })

notesRouter.route('/:note_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const noteId = req.params.note_id

        NotesServices.getById(knexInstance, noteId)
            .then(note => {
                if (!note) {
                    return res.status(404).json({
                        error: { message: `Note doesn't exist` }
                    })
                }
                res.note = note
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(sanitizeNote(res.note))
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const noteId = req.params.note_id

        const { title, folder_id, content } = req.body
        const noteToUpdate = { title, folder_id, content }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length

        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'folder id', or 'content'`
                }
            })
        }

        NotesServices.updateNote(knexInstance, noteId, noteToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const noteId = req.params.note_id

        NotesServices.deleteNote(knexInstance, noteId)
            .then(numRowsAffected => {
                res.status(204)
            })
            .catch(next)
    })

module.exports = notesRouter