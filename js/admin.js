const departmentMap = {
  "admin_garbage_uid": "Garbage",
  "admin_water_uid": "Water",
  "admin_electricity_uid": "Electricity",
  "admin_road_uid": "Road"
};

auth.onAuthStateChanged(user => {
  if (user) {
    const dept = departmentMap[user.uid];
    loadDepartmentComplaints(dept);
  }
});
