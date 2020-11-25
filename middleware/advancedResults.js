const advancedResults = (model, populate) => async (req, res, next) => {
    let query

    //Copy of req.query
    let reqQuery = { ...req.query }

    //Fields to exclude
    const removeFields = ['select','sort','page','limit']

    //Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param])

    //Create query string
    let queryStr = JSON.stringify(reqQuery)

    //Create Operators ($gt, $gte, $lt...)
    queryStr = queryStr.replace(/\b(gt|lt|gte|lte|in)\b/g, match => `$${match}`)

    //Finding resouce
    query = model.find(JSON.parse(queryStr))

    //Select query
    if(req.query.select) {
        const fields = req.query.select.split(",").join(" ")
        query = query.select(fields)
    }

    //Sort
    if(req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ")
        console.log(sortBy)
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')
    }

    //Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 25
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const total = await model.countDocuments()

    query = query.skip(startIndex).limit(limit)

    if(populate) {
        query = query.populate(populate)
    }

    //Executing query
    const results = await query

    //Pagination result
    const pagination = {}

    //Next page
    if(endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    //Previous page
    if(startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    next()
}

module.exports = advancedResults