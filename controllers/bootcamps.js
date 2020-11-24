const ErrorResponse = require('../utils/errorResponse')
const geocoder = require('../utils/geocoder')
const asyncHandler = require('../middleware/async')
const Bootcamp = require('../models/Bootcamp')

//@desc       Get all bootcamps
//@route      Get /api/v1/bootcamps
//@access     Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
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
    query = Bootcamp.find(JSON.parse(queryStr)).populate({
        path: 'courses',
        select: 'title'
    })

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
    const total = await Bootcamp.countDocuments()

    query = query.skip(startIndex).limit(limit)

    //Executing query
    const bootcamp = await query

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

    res.status(200).json({ success: true, pagination, count: bootcamp.length, data: bootcamp })
})

//@desc       Get single bootcamp
//@route      Get /api/v1/bootcamps/:id   
//@access     Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if(!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        )
    }
    res.status(200).json({ success: true, data: bootcamp }) 
})

//@desc       Create new bootcamp
//@route      POST /api/v1/bootcamps
//@access     Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({ success: true, data: bootcamp }) 
})

//@desc       Update bootcamp
//@route      PUT /api/v1/bootcamps/:id
//@access     Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        )
    }

    res.status(200).json({ success: true, data: bootcamp })
})

//@desc       Delete bootcamp
//@route      PUT /api/v1/bootcamps/:id
//@access     Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        )
    }

    await bootcamp.remove()
    res.status(200).json({success: true, data: {} })
})

//@desc       Get bootcamps with a radius
//@route      PUT /api/v1/bootcamps/radius/:zipcode/:distance
//@access     Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params

    //Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude

    //Calc radius using radians
    const radius = distance / 3963

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: { $centerSphere: [ [ lng, lat ], radius ] }
        }
    })

    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps })
})