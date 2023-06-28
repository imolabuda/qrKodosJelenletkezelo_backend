
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const crypto = require('crypto');


const {onRequest} = require("firebase-functions/v2/https");



admin.initializeApp();

const db = admin.firestore();

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello world!");
// });

//GET nextQRCode
  exports.getNextQrCode = functions.https.onCall(async (data, context) => {
    const documentId = data.email; // A lekérdezni kívánt dokumentum azonosítója
    let teacherID = "";
    let courseID = "";
    let classID = "";
    let randomToken = "";
    
    teacherID = await getTeacherIDByEmail(documentId)
      .then((result) => {
      // Az `onCall` függvény válasza
      console.log(result);
       // ... Kezeld a visszatérített dokumentum adatokat
      return result;
    })
    .catch((error) => {
      // Hiba kezelése
     console.error(error);
     throw new Error('An error occurred while retrieving the document.');
    // ... Kezeld a hibát
    });
    courseID = await getCourseIDByTeacherID(teacherID)
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((error) => {
        console.error(error);
        throw new Error('An error occurred while retrieving the document.');
      });

    classID = await getClassIDByCourseID(courseID)
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((error) => {
        console.error(error);
        throw new Error('An error occurred while retrieving the document.');
      });

    randomToken = generateRandomString(10);  
    await createQrCodeByClassID(classID, randomToken);
    return randomToken;
  });

async function getTeacherIDByEmail(email) {
  const documentId = email; // A lekérdezni kívánt dokumentum azonosítója
  console.log('getTIBE return elott'+documentId);
    // Firestore lekérdezés
    try {
    const doc = await admin.firestore().collection('Teachers').get();
    let teacherID;
    doc.forEach(document => {
      if (document.data().teacherEmail == documentId) {
        teacherID = document.id;
        console.log(document.id, '=>', document.data());
      }
    });
    console.log('getTIBE return elott'+teacherID);
    return teacherID;
  } catch (error) {
    // Hiba kezelése
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function getCourseIDByTeacherID(teacherId) {
  const documentId = teacherId; // A lekérdezni kívánt dokumentum azonosítója
  console.log('getCIBT'+documentId);
    // Firestore lekérdezés
    try {
    const doc = await admin.firestore().collection('Courses').get();
    let courseID;
    doc.forEach(document => {
      if (document.data().teacherID == documentId) {
        courseID = document.id;
        console.log(document.id, '=>', document.data());
      }
    });
    console.log('getCIBT return elott'+courseID);
    return courseID;
  } catch (error) {
    // Hiba kezelése
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function getClassIDByCourseID(courseId) {
  const documentId = courseId; // A lekérdezni kívánt dokumentum azonosítója
  console.log('getCIBCI'+documentId);
    // Firestore lekérdezés
    try {
    const doc = await admin.firestore().collection('Classes').get();
    let classID;
    let todayNow = new Date().getTime();
    //let currentDay = todayNow.getDay();
    //let currentTime = todayNow.getHours();
    let currentTime = todayNow; //.getTime()
    doc.forEach(document => {
      if (document.data().courseID === documentId){
        console.log("ido a tablabol " + document.data().time);
        console.log("atalakitott " + document.data().time.toDate());
        console.log("document.data().time.toDate().getTime() " + document.data().time.toDate().getTime());
        console.log("currentTime (new Date().getTime()): " + currentTime);
        console.log("document.data().time.toDate().getTime() + 7200: " + document.data().time.toDate().getTime() + 7200);
        let lower_limit = document.data().time.toDate().getTime();
        let upper_limit = document.data().time.toDate().getTime() + (2*60*60*1000);
        
        if((lower_limit <= currentTime) && (upper_limit >= currentTime)){
            console.log("jelenlegi ido" + currentTime);
            classID = document.id;
            console.log(document.id, '=>', document.data());
        }
      }
    });
    console.log('getCIBCI return elott'+classID);
    return classID;
  } catch (error) {
    // Hiba kezelése
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function createQrCodeByClassID (classID , qrCode){
  const newQrCode = {
    classID : classID,
    qrCode : qrCode
  }
  await admin.firestore().collection('QrCodes').add(newQrCode)
    .then((doc) => {
      return 'document' + doc.id +  'created successfully';
    })
    .catch((err) => {
      return 'something went wrong';
      console.error(err);
    });
}

function generateRandomString (length){
  try {
    const randomBytes = crypto.randomBytes(length);
    const randomString = randomBytes.toString('hex');

    return randomString ;
  } catch (error) {
    console.error('Error generating random string:', error);
    return 'Error generating random string';
  }
}

// ATTENDENCE for the student
exports.getAttendenceSuccessOrNot = functions.https.onCall(async (data, context) => {
  let studentID = "";
  let classID = "";
  let token = "";

  token = data.token;

  classID = await getClassIDByToken(data.token)
    .then((result) => {
      console.log(result);
      return result;
    })
    .catch((error) => {
      console.error(error);
      throw new Error('An error occurred while retrieving the document.');
    });

  studentID = await getStudentIDByEmail(data.email)
  .then((result) => {
    console.log(result);
    return result;
  })
  .catch((error) => {
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  });

  let text = await createAttendenceByEmailAndToken(token, classID, studentID);
  return text;
});

async function getStudentIDByEmail(email){
  try{
    const doc = await admin.firestore().collection('Students').get();
    let studentID;
    doc.forEach(document => {
      if (document.data().studentEmail == email) {
        studentID = document.id;
        console.log(document.id, '=>', document.data());
      }
    });
    return studentID;
  } catch(error){
    console.log(error);
  }
}

async function getClassIDByToken(token){
  try{
    const doc = await admin.firestore().collection('QrCodes').get();
    let classID;
    doc.forEach(document => {
      if (document.data().qrCode == token) {
        classID = document.data().classID;
        console.log(document.id, '=>', document.data());
      }
    });
    return classID;
  } catch(error){
    console.log(error);
  }
}

async function createAttendenceByEmailAndToken(token, classID, studentID){
  const newAttendence = {
    attendenceToken : token,
    classID : classID,
    studentID : studentID
  }
  await admin.firestore().collection('Attendence').add(newAttendence)
    .then((doc) => {
      return 'document' + doc.id +  'created successfully';
    })
    .catch((err) => {
      return 'something went wrong';
      console.error(err);
    });
}









///////////////////////////////////////////////////////GET TABLES///////////////////////////////////////////////////////

//GET attendences
exports.getAttendences = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('Attendence')
    .get()
    .then((data) => {
      let attendences = [];
      data.forEach((doc) => {
        attendences.push(doc.data());
      });
      return res.json(attendences);
    })
    .catch((err) => console.error(err));
});

//GET courses
exports.getCourses = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('Courses')
    .get()
    .then((data) => {
      let courses = [];
      data.forEach((doc) => {
        courses.push(doc.data());
      });
      return res.json(courses);
    })
    .catch((err) => console.error(err));
});

//GET classes
exports.getClasses = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('Classes')
    .get()
    .then((data) => {
      let classes = [];
      data.forEach((doc) => {
        classes.push(doc.data());
      });
      return res.json(classes);
    })
    .catch((err) => console.error(err));
});

//GET students
exports.getStudents = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('Students')
    .get()
    .then((data) => {
      let students = [];
      data.forEach((doc) => {
        students.push(doc.data());
      });
      return res.json(students);
    })
    .catch((err) => console.error(err));
});

//GET teachers
exports.getTeachers = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('Teachers')
    .get()
    .then((data) => {
      let teachers = [];
      data.forEach((doc) => {
        teachers.push(doc.data());
      });
      return res.json(teachers);
    })
    .catch((err) => console.error(err));
});

////////////////////////////////////////////////////////GET ONE DOCUMENT/////////////////////////////////////////////////////////

//GET teacher
exports.getTeacher = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection('Teachers')
    .get()
    .then((data) => {
      let teachers = [];
      data.forEach((doc) => {
        teachers.push(doc.data());
      });
      return res.json(teachers);
    })
    .catch((err) => console.error(err));
});



///////////////////////////////////////////////////////CREATE NEW DOCUMENT///////////////////////////////////////////////////////

//CREATE attendence
exports.createAttendence = functions.https.onRequest((req, res) =>{
  const newAttendance = {
    attendenceToken: req.body.attendenceToken,
    classID: req.body.classID,
    studentID: req.body.studentID,
    //createdAt: admin.firestore.Timestamp.fromDate(new Date())?
  };

  admin
    .firestore()
    .collection('Attendence')
    .add(newAttendance)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: `something went wrong`});
      console.error(err);
    });

});

//CREATE course
exports.createCourse = functions.https.onRequest((req, res) =>{
  const newCourse = {
    courseID: req.body.courseID,
    courseName: req.body.courseName,
    teacherID: req.body.teacherID,
    type: req.body.type
  };

  admin
    .firestore()
    .collection('Courses')
    .add(newCourse)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: `something went wrong`});
      console.error(err);
    });

});

//CREATE class
exports.createClass = functions.https.onRequest((req, res) =>{
  const newClass = {
    classID: req.body.classID,
    courseID: req.body.courseID,
    time: req.body.time
  };

  admin
    .firestore()
    .collection('Classes')
    .add(newClass)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: `something went wrong`});
      console.error(err);
    });

});

//CREATE student
exports.createStudent = functions.https.onRequest((req, res) =>{
  const newStudent = {
    dateOfBirth: req.body.dateOfBirth,
    studentAuthToken: req.body.studentAuthToken,
    studentEmail: req.body.studentEmail,
    studentID: req.body.studentID,
    studentName: req.body.studentName,
    studentPassword: req.body.studentPassword
  };

  admin
    .firestore()
    .collection('Students')
    .add(newStudent)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: `something went wrong`});
      console.error(err);
    });

});

//CREATE teacher
exports.createTeacher = functions.https.onRequest((req, res) =>{
  const newTeacher= {
    dateOfBirth: req.body.dateOfBirth,
    teacherAuthToken: req.body.teacherAuthToken,
    teacherEmail: req.body.teacherEmail,
    teacherID: req.body.teacherID,
    teacherName: req.body.teacherName,
    teacherPassword: req.body.teacherPassword
  };

  admin
    .firestore()
    .collection('Teachers')
    .add(newTeacher)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: `something went wrong`});
      console.error(err);
    });

});

//CREATE qrCode
//keresbol ki tudom venni, hogy melyik ora
exports.createQrCode = functions.https.onRequest((req, res) =>{
  const newQrCode= {
    dateOfBirth: req.body.dateOfBirth,
    teacherAuthToken: req.body.teacherAuthToken,
    teacherEmail: req.body.teacherEmail,
    teacherID: req.body.teacherID,
    teacherName: req.body.teacherName,
    teacherPassword: req.body.teacherPassword
  };

  admin
    .firestore()
    .collection('Teachers')
    .add(newTeacher)
    .then((doc) => {
      res.json({message: `document ${doc.id} created successfully`});
    })
    .catch((err) => {
      res.status(500).json({error: `something went wrong`});
      console.error(err);
    });

});