
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
    const documentId = data.email;
    const token = data.token;
    const webLat = data.webLatitude;
    const webLong = data.webLongitude;

    // console.log("webLong: "+ webLong);
    let valid = "";
    if (token != ""){
      valid = await checkValidToken(token)
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((error) => {
       console.error(error);
       throw new Error('An error occurred while retrieving the document.');
      });
      console.log(valid);
      if (valid == "valid"){
        return token;
      }
    }else{
      console.log("ures a token");
    }

    let teacherID = "";
    let courseID = "";
    let classID = "";
    let randomToken = "";
    
    teacherID = await getTeacherIDByEmail(documentId)
      .then((result) => {
      console.log(result);
      return result;
    })
    .catch((error) => {
     console.error(error);
     throw new Error('An error occurred while retrieving the document.');
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
    await createQrCodeByClassID(classID, randomToken, webLat, webLong);
    return randomToken;
  });

async function checkValidToken(token){
  try{
    let valid="not valid";
    const doc = await admin.firestore().collection('QrCodes').get();
    doc.forEach(document => {
      if (document.data().qrCode == token) {
        valid = "valid";      
      }
    });
    return valid;
  } catch (error){
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function getTeacherIDByEmail(email) {
  const documentId = email; 
    try {
    const doc = await admin.firestore().collection('Teachers').get();
    let teacherID;
    doc.forEach(document => {
      if (document.data().teacherEmail == documentId) {
        teacherID = document.id;
        console.log(document.id, '=>', document.data());
      }
    });
    return teacherID;
  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function getCourseIDByTeacherID(teacherId) {
  const documentId = teacherId; 
    try {
    const doc = await admin.firestore().collection('Courses').get();
    let courseID;
    doc.forEach(document => {
      if (document.data().teacherID == documentId) {
        courseID = document.id;
        console.log(document.id, '=>', document.data());
      }
    });
    return courseID;
  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function getClassIDByCourseID(courseId) {
  const documentId = courseId; 

    try {
    const doc = await admin.firestore().collection('Classes').get();
    let classID;
    let todayNow = new Date().getTime();
    let currentTime = todayNow;

    doc.forEach(document => {
      if (document.data().courseID === documentId){
        let lower_limit = document.data().time.toDate().getTime();
        let upper_limit = document.data().time.toDate().getTime() + (2*60*60*1000);
        
        if((lower_limit <= currentTime) && (upper_limit >= currentTime)){
            console.log("jelenlegi ido" + currentTime);
            classID = document.id;
            console.log(document.id, '=>', document.data());
        }
      }
    });
    return classID;
  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function createQrCodeByClassID (classID , qrCode, webLat, webLong){
  const newQrCode = {
    classID : classID,
    qrCode : qrCode,
    webLat : webLat,
    webLong : webLong
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

  classID = await getClassIDByToken(data.token,data.latitude,data.longitude)
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

  const docRef = admin.firestore().collection('Classes').doc(classID);
  const document = await docRef.get();

  let time = document.data().time;
  const docRef2 = admin.firestore().collection('Courses').doc(document.data().courseID);
  const document2 = await docRef2.get();

  console.log("A talalt ora neve: " + document2.data().courseName);
  console.log("A talalt ora ideje: " + time);
// 
  let text = await createAttendenceByEmailAndToken(token, classID, studentID);

  const attendenceInfo = {
    courseName: document2.data().courseName,
    time : time
  }
  return attendenceInfo;
});

function checkDistance(webLat,webLong,appLat,appLong){
  let a = Math.abs(webLat - appLat);
  let b = Math.abs(webLong - appLong);
  a=a*1000;
  b=b*1000;
  // console.log("a: "+a+"b: "+b);
  if ((a<2) && (b<2)){
    return true;
  }
  return false;
}

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

async function getClassIDByToken(token,mobLat,mobLong){
  try{
    const doc = await admin.firestore().collection('QrCodes').get();
    let classID;
    doc.forEach(document => {
      if (document.data().qrCode == token) {
        if (checkDistance(document.data().webLat,document.data().webLong,mobLat,mobLong)){
          classID = document.data().classID;
          console.log(document.id, '=>', document.data());
        } 
      }
    });
    return classID;
  } catch(error){
    console.log(error);
  }
}

async function studentHasAttendence(classID,studentID){
    try {
    const doc = await admin.firestore().collection('Attendence').get();
    let has = "dontHaveAttendence";
    doc.forEach(document => {
      if ((document.data().studentID == studentID) && (document.data().classID == classID)) {
        has = "hasAttendece";
        
      }
    });
    return has;
  } catch (error) {
    // Hiba kezelése
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  }
}

async function createAttendenceByEmailAndToken(token, classID, studentID){
  const newAttendence = {
    attendenceToken : token,
    classID : classID,
    studentID : studentID
  }

  let has = await studentHasAttendence(classID,studentID)
  .then((result) => {
    console.log(result);
    return result;
  })
  .catch((error) => {
    console.error(error);
    throw new Error('An error occurred while retrieving the document.');
  });
  console.log("van jelenlet vagy nincs: " + has);

  if (has == "hasAttendece"){
    return "Has Attandence already";
  }

  await admin.firestore().runTransaction(async (req,res) => {
  try {
    const doc = await admin.firestore().collection('QrCodes').get();
    let docID;
    doc.forEach(document => {
      if (document.data().qrCode == token) {
        docID = document.id;
        console.log(document.id, '=>', document.data());
      }
    });
    console.log("most fogok torolni : "+docID);
    const result = await admin.firestore().collection('QrCodes').doc(docID).delete();
    console.log(result);
    return result;
  }catch (errror){
    return errror.message;
  }});

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