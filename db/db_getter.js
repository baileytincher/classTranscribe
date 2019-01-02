'use strict';
var Sequelize = require('sequelize');
var models = require('../models');
const uuid = require('uuid/v4');
const sequelize = models.sequelize;

const Op = Sequelize.Op;
const CourseOffering = models.CourseOffering;
const Course = models.Course;
const Dept = models.Dept;
const EchoSection = models.EchoSection;
const Lecture = models.Lecture;
const Media = models.Media;
const MSTranscriptionTask = models.MSTranscriptionTask;
const Offering = models.Offering;
const Role = models.Role;
const Term = models.Term;
const University = models.University;
const User = models.User;
const UserOffering = models.UserOffering;
const YoutubeChannel = models.YoutubeChannel;
const CourseOfferingMedia = models.CourseOfferingMedia;
/* ----- end of defining ----- */

function getAllCourses() {
  return Course.findAll({limit: 8})
}

function getPlaylistByCourseOfferingId(courseOfferingId) {
  return sequelize.query(
   'SELECT mst.videoLocalLocation, mst.srtFileLocation, M.siteSpecificJSON \
    FROM MSTranscriptionTasks AS mst \
    INNER JOIN Media as M on mst.mediaId = M.id \
    INNER JOIN CourseOfferingMedia as com on com.mediaId = M.id \
    WHERE com.courseOfferingId = ?',
   { replacements: [ courseOfferingId ], type: sequelize.QueryTypes.SELECT}
 ).catch(err => {throw new Error('getPlaylistByCourseOfferingId() Failed' + err.message)}); /* raw query */
}

function getTask(taskId) {
    return MSTranscriptionTask.findById(taskId);
}

function getMedia(mediaId) {
    return Media.findById(mediaId);
}

function getMediaByTask(taskId) {
    return getTask(taskId).then(task => getMedia(task.mediaId));
}

function getEchoSection(sectionId) {
    return EchoSection.findById(sectionId);
}

function getUserByEmail(email) {
  /* Since the email should be unique,
   * findOne() is sufficient
   */
  return User.findOne({
    where : { mailId : email }
  }).then(result => {

    try {
      return result.dataValues;
    } catch (err) {
      console.error('User not found');
      return null;
    }

  }).catch(err => {throw new Error('getUserByEmail() Failed' + err.message)});
}

/* SELECT * FROM User WHERE googleId=profileId LIMIT 1*/
function getUserByGoogleId(profileId) {
    /* Since the email should be unique,
     * findOne() is sufficient
     */
    return User.findOne({
        where: { googleId: profileId }
    }).then(result => {
        if (result) {
            return result.dataValues;
        } else {
            return null;
        }
    }).catch(err => {throw new Error('getUserByGoogleId()' + err.message);});
}

/* findOrCreate university to Table Universities,
 * Shouldn't be used since we
 * currently only support UIUC
 */
function getUniversityId(universityName) {

  return University.findOrCreate({
    where: {
      universityName : universityName,
    }, defaults: {
      id: uuid(),
    }
  }).then(result => {
    return result[0].dataValues;
  }).catch(err => {throw new Error('getUniversityId()' + err.message)});
}

/* Assuming input is an array */
function getCoursesByTerms(term) {
  var termId_list = []
  var offeringId_list = [];
  var courseId_list = [];

  return Term.findAll({ // fetch termId
    where : {
      termName : { [Op.in] : term } // SELECT * FROM Term WHERE termName IN term
    }
  }).then((result) => { // fetch offeringId
    for (let i = 0; i < result.length; i++) {
      termId_list[i] = result[i].dataValues.id;
    }
    return Offering.findAll({
      where : {
        termId: { [Op.in] : termId_list } // SELECT * FROM Offering WHERE termId == result:  (list)
      }
    });
  }).then((result) => { // fetch courseId
    for (let i = 0; i < result.length; i++) {
      offeringId_list[i] = result[i].dataValues.id;
    }
    return CourseOffering.findAll({
      where : {
        offeringId : { [Op.in] : offeringId_list} // SELECT * FROM CourseOffering WHERE offeringId IN result
      }
    });
  }).then((result) => { // fetch Courses
    for (let i = 0; i < result.length; i++) {
      courseId_list[i] = result[i].dataValues.courseId;
    }
    return getCoursesByIds(courseId_list);
  });
}

/* SELECT * FROM Course WHERE id IN courseId */
function getCoursesByIds(courseId) {
  return Course.findAll({
    where : {
      id : {[Op.in] : courseId}
    }
  }).then(values => {
    var jsonList = values.map(value => value.dataValues);
    return jsonList;
  }).catch(err => {throw new Error('getCoursesByIds() Failed' + err.message);});
}

function getCourseId(courseInfo) {
  var dept = courseInfo.dept;
  return Dept.findOne({
    where : {
      deptName : dept.name,
      acronym : dept.acronym,
    }
  }).then(result => {
    var deptInfo = result.dataValues;
    return Course.findOrCreate({
      where : {
        courseName : courseInfo.courseName,
        courseNumber : courseInfo.courseNumber,
        deptId : deptInfo.id,
      },
      defaults : {
        id: uuid(),
        courseDescription : courseInfo.courseDescription,
      }
    }).then(result => {
      return result[0].dataValues;
    }).catch(err => {throw new Error('getCourseId() Failed' + err.message);}); /* Course.findOrCreate() */
  }).catch(err => {throw new Error('getCourseId() Failed' + err.message);}); /* Dept.findOne() */
}

/* getRole() findOrCreate a role */
function getRoleId(role) {
  return Role.findOrCreate({
    where : { roleName : role },
    defaults : { id: uuid() }
  }).then(result => {
    return result[0].dataValues;
  }).catch(err => {throw new Error('getRoleId() Failed' + err.message)});
}

/* findOrCreate term, and return termId */
function getTermId(term) {
  return Term.findOrCreate({
    where : { termName : term },
    defaults : { id: uuid() }
  }).then( result => {
    return result[0].dataValues;
  }).catch( err => {throw new Error('getTermId() Failed' + err.message);});
}

function getDeptId(dept) {
  return Dept.findOrCreate({
    where : { deptName : dept.name },
    defaults : {
      id: uuid(),
      acronym : dept.acronym
    }
  }).then(result => {
    return result[0].dataValues;
  }).catch(err => {throw new Error('getDeptId() Failed' + err.message);});
}

/* getOfferingId() findOrCreate an offeringId */
function getOfferingId(id, sectionName) {
  return Offering.findOrCreate({
    where : {
      termId : id.termId,
      deptId : id.deptId,
      universityId : id.universityId,
      section : sectionName,
    }, defaults : {
      id: uuid()
    }
  }).then(result => {
    return result[0].dataValues;
  }).catch(err => {
    throw new Error('getOfferingId() Failed' + err.message);
  });
}

/* Get All Terms */
function getTerms() {
  return Term.findAll().then(values => {
    var result = values.map(value => value.dataValues);
    return result;
  });
}

/* Get All Courses by University */
function getCoursesByUniversityId( universityId ) {

  return sequelize.query(
    'SELECT oid.*, cid.*, coid.id\
     FROM \
     Offerings oid, CourseOfferings coid, Courses cid \
     WHERE \
     oid.id = coid.offeringId AND cid.id = coid.courseId AND oid.universityId = ?',
     { replacements: [ universityId ], type: sequelize.QueryTypes.SELECT })
     .then(values => {
       return values.map(value => {

         /* move value.id to value.courseOfferingId */
         value.courseOfferingId = value.id;
         delete value.id;

         /* remove time attribute */
         delete value.createdAt;
         delete value.updatedAt;
         return value;
       })
     }).catch(err => {
       throw new Error('getCoursesByUniversityId() Failed' + err.message);
     }); /* raw query */
}

/* Get All Courses by User info */
function getCoursesByUserId( uid ) {

  return UserOffering.findAll({
    where : { userId : uid },
  }).then(values => {

    if(values.length === 0) {
      return values;
    }

    const courseOfferingIds = values.map(value => value.dataValues.courseOfferingId);

    return sequelize.query(
      'SELECT oid.*, cid.*, coid.id\
      FROM \
      Offerings oid, CourseOfferings coid, Courses cid\
      WHERE \
      oid.id = coid.offeringId AND cid.id = coid.courseId AND coid.id IN (:coids)',
      { replacements: { coids : courseOfferingIds }, type: sequelize.QueryTypes.SELECT })
      .then(values => {

        return values.map(value => {
          /* move value.id to value.courseOfferingId */
          value.courseOfferingId = value.id;
          delete value.id;

          /* remove time attribute */
          delete value.createdAt;
          delete value.updatedAt;
          return value;
        });

      }).catch(err => {
        throw new Error('getCoursesByUserId() Failed' + err.message);
      }); /* rawquery */
    }).catch(err => {
      throw new Error('getCoursesByUserId() Failed' + err.message);
    }); /* UserOffering.findAll() */
}

function getUniversityName (universityId) {
  return University.findById(universityId);
}

function getTermsById (ids) {
  return Term.findAll({
    where : {
      id : { [Op.in] : ids }
    }
  }).then(values => {
    return values.map(value => value.dataValues);
  }).catch(err => {throw new Error('getTermsById() Failed' + err.message);})
}

function getDeptsById (ids) {
  return Dept.findAll({
    where : {
      id : { [Op.in] : ids }
    }
  }).then(values => {
    return values.map(value => value.dataValues);
  }).catch(err => {
    throw new Error('getDeptsById() Failed' + err.message);
  })
}

function getSectionsById (ids) {
  return Offering.findAll({
    where : {
      id : { [Op.in] : ids }
    },
  }).then(values => {
    return values.map(value => value.dataValues);
  }).catch(err => {
    throw new Error('getSectionsById() Failed' + err.message);
  })
}

function getInstructorsByCourseOfferingId (ids) {
  /* empty input */
  if (ids.length === 0) {
    return ids;
  }

  return Role.findOne({
    /* find Instructor's uuid */
    where : { roleName : 'Instructor', },
  }).then(result => {
    var instructorId = result.dataValues.id;

    /*
     * query to fetch informations based on courseOfferingIds and roleId
     *
     * only select relative information
     */
    return sequelize.query(
      'SELECT uoid.courseOfferingId, uid.id, uid.firstName, uid.lastName, uid.mailId \
      FROM \
      UserOfferings uoid, Users uid \
      WHERE \
      uoid.courseOfferingId IN (:coids) AND uoid.roleId = :rid AND uoid.userId = uid.id',
      { replacements: { coids : ids, rid : instructorId }, type: sequelize.QueryTypes.SELECT })
      .catch(err => {
        throw new Error('getInstructorsByCourseOfferingId() Failed' + err.message);
      }); /* sequelize.query() */
    }).catch(err => {
      throw new Error('getInstructorsByCourseOfferingId() Failed' + err.message);
    }); /* Role.findOne() */
}

function getCourseByOfferingId(offeringId) {
  return CourseOffering.findAll({
    where : { offeringId : offeringId }
  }).then(values => {
    var courseInfos = values.map(value => value.dataValues);
    var courseIds = courseInfos.map(courseInfo => courseInfo.id);
    return Course.findAll({
      where : {
        id : { [Op.in] : courseIds },
      }
    }).then(values => {
      return values.map(value => value.dataValues);
    }).catch(err => {
      throw new Error('getCourseByOfferingId() Failed' + err.message);
    }); /* Course.findAll() */
  }).catch(err => {
    throw new Error('getCourseByOfferingId() Failed' + err.message);
  }); /* CourseOffering.findAll() */
}

function getDept(deptId) {
  return Dept.findOne({
    where : {
      id : deptId,
    }
  }).then(result => {
    return result.dataValues;
  }).catch(err => {
    throw new Error('getDept() Failed' + err.message);
  });
}

module.exports = {
  getAllCourses: getAllCourses,
  getPlaylistByCourseOfferingId: getPlaylistByCourseOfferingId,
  getTask: getTask,
  getMedia: getMedia,
  getMediaByTask: getMediaByTask,
  getEchoSection: getEchoSection,
  getUserByEmail: getUserByEmail,
  getUserByGoogleId: getUserByGoogleId,
  getUniversityId: getUniversityId,
  getUniversityName : getUniversityName,
  getCoursesByTerms : getCoursesByTerms,
  getCoursesByIds : getCoursesByIds,
  getCoursesByUniversityId : getCoursesByUniversityId,
  getCoursesByUserId : getCoursesByUserId,
  getCourseId : getCourseId,
  getCourseByOfferingId : getCourseByOfferingId,
  getRoleId : getRoleId,
  getTermId : getTermId,
  getTermsById : getTermsById,
  getTerms : getTerms,
  getDeptId : getDeptId,
  getDept : getDept,
  getOfferingId : getOfferingId,
  getDeptsById : getDeptsById,
  getSectionsById : getSectionsById,
  getInstructorsByCourseOfferingId : getInstructorsByCourseOfferingId,
}