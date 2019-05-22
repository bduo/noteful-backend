const FoldersServices = {
    getAllFolders(knex) {
        return knex.select('*').from('noteful_folders')
    },
    
    getById(knex, id) {
        return knex.from('noteful_folders').select('*').where('id', id)
        .first()
    },
    
    insertFolder(knex, newFolder) {
        return knex
            .insert(newFolder)
            .into('noteful_folders')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    updateFolder(knex, id, newFolderFields) {
        return knex('noteful_folders')
            .where({ id })
            .update(newFolderFields)
    },

    deleteFolder(knex, id) {
        return knex('noteful_folders')
            .where( { id } )
            .delete()
    },
}

module.exports = FoldersServices