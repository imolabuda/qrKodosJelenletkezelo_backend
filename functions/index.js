const functions = require("firebase-functions");
const admin = require('firebase-admin');

admin.initializeApp();

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello world!");
// });

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