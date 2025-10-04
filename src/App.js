import React, { useState, useEffect } from 'react';
import { Users, Mail, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const WorkshopCapacitySystem = () => {
  const [workshops, setWorkshops] = useState([
    {
      id: 1,
      name: 'Introduction to Python',
      capacity: 5,
      registered: [],
      waitlist: [],
      date: '2025-10-15',
      time: '10:00 AM'
    },
    {
      id: 2,
      name: 'Web Development Basics',
      capacity: 3,
      registered: [],
      waitlist: [],
      date: '2025-10-20',
      time: '2:00 PM'
    },
    {
      id: 3,
      name: 'Data Science Workshop',
      capacity: 4,
      registered: [],
      waitlist: [],
      date: '2025-10-25',
      time: '11:00 AM'
    }
  ]);

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Add notification
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  // Send email simulation
  const sendEmail = (to, subject, body) => {
    addNotification(`📧 Email sent to ${to}: ${subject}`, 'email');
    console.log(`EMAIL TO: ${to}\nSUBJECT: ${subject}\nBODY: ${body}`);
  };

  // Auto-move from waitlist when spot opens
  const processWaitlist = (workshopId) => {
    setWorkshops(prev => prev.map(workshop => {
      if (workshop.id === workshopId && workshop.waitlist.length > 0 && workshop.registered.length < workshop.capacity) {
        const spotsAvailable = workshop.capacity - workshop.registered.length;
        const toMove = workshop.waitlist.slice(0, spotsAvailable);
        const remainingWaitlist = workshop.waitlist.slice(spotsAvailable);

        toMove.forEach(student => {
          sendEmail(
            student.email,
            `Spot Available: ${workshop.name}`,
            `Great news ${student.name}! A spot has opened up in ${workshop.name}. You have been automatically moved from the waitlist to registered. Workshop Date: ${workshop.date} at ${workshop.time}`
          );
          addNotification(`${student.name} auto-moved from waitlist to ${workshop.name}`, 'success');
        });

        return {
          ...workshop,
          registered: [...workshop.registered, ...toMove],
          waitlist: remainingWaitlist
        };
      }
      return workshop;
    }));
  };

  // Register student
  const registerStudent = (e) => {
    e.preventDefault();
    
    if (!studentName || !studentEmail || !selectedWorkshop) {
      addNotification('Please fill in all fields', 'error');
      return;
    }

    const workshop = workshops.find(w => w.id === parseInt(selectedWorkshop));
    if (!workshop) return;

    const student = { name: studentName, email: studentEmail, registeredAt: new Date() };

    setWorkshops(prev => prev.map(w => {
      if (w.id === workshop.id) {
        // Check if already registered or waitlisted
        if (w.registered.some(s => s.email === studentEmail) || w.waitlist.some(s => s.email === studentEmail)) {
          addNotification('Student already registered or waitlisted for this workshop', 'error');
          return w;
        }

        // Check capacity
        if (w.registered.length < w.capacity) {
          sendEmail(
            studentEmail,
            `Registration Confirmed: ${w.name}`,
            `Hi ${studentName}, You are confirmed for ${w.name} on ${w.date} at ${w.time}. We look forward to seeing you!`
          );
          addNotification(`${studentName} registered for ${w.name}`, 'success');
          return { ...w, registered: [...w.registered, student] };
        } else {
          sendEmail(
            studentEmail,
            `Waitlist Confirmation: ${w.name}`,
            `Hi ${studentName}, ${w.name} is currently full. You have been added to the waitlist (position ${w.waitlist.length + 1}). We'll notify you if a spot opens up.`
          );
          addNotification(`${studentName} added to waitlist for ${w.name}`, 'info');
          return { ...w, waitlist: [...w.waitlist, student] };
        }
      }
      return w;
    }));

    setStudentName('');
    setStudentEmail('');
    setSelectedWorkshop('');
  };

  // Cancel registration
  const cancelRegistration = (workshopId, studentEmail) => {
    setWorkshops(prev => prev.map(w => {
      if (w.id === workshopId) {
        const student = w.registered.find(s => s.email === studentEmail);
        if (student) {
          sendEmail(
            studentEmail,
            `Registration Cancelled: ${w.name}`,
            `Hi ${student.name}, Your registration for ${w.name} has been cancelled.`
          );
          addNotification(`${student.name} cancelled registration for ${w.name}`, 'info');
          
          const updatedWorkshop = {
            ...w,
            registered: w.registered.filter(s => s.email !== studentEmail)
          };
          
          // Trigger waitlist processing after state update
          setTimeout(() => processWaitlist(workshopId), 0);
          
          return updatedWorkshop;
        }
      }
      return w;
    }));
  };

  // Remove from waitlist
  const removeFromWaitlist = (workshopId, studentEmail) => {
    setWorkshops(prev => prev.map(w => {
      if (w.id === workshopId) {
        const student = w.waitlist.find(s => s.email === studentEmail);
        if (student) {
          sendEmail(
            studentEmail,
            `Removed from Waitlist: ${w.name}`,
            `Hi ${student.name}, You have been removed from the waitlist for ${w.name}.`
          );
          addNotification(`${student.name} removed from waitlist for ${w.name}`, 'info');
          return { ...w, waitlist: w.waitlist.filter(s => s.email !== studentEmail) };
        }
      }
      return w;
    }));
  };

  // Send reminder emails
  const sendReminders = (workshopId) => {
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) return;

    workshop.registered.forEach(student => {
      sendEmail(
        student.email,
        `Reminder: ${workshop.name} Coming Up`,
        `Hi ${student.name}, This is a reminder that ${workshop.name} is scheduled for ${workshop.date} at ${workshop.time}. See you there!`
      );
    });
    addNotification(`Reminders sent to ${workshop.registered.length} students for ${workshop.name}`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Workshop Capacity Management</h1>
          <p className="text-gray-600">Register students, manage capacity, and handle waitlists automatically</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} />
                Student Registration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="student@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Workshop
                  </label>
                  <select
                    value={selectedWorkshop}
                    onChange={(e) => setSelectedWorkshop(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose workshop...</option>
                    {workshops.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.registered.length}/{w.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    registerStudent(e);
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Register Student
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Mail size={20} />
                Recent Notifications
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded text-sm ${
                        notif.type === 'success' ? 'bg-green-50 text-green-800' :
                        notif.type === 'error' ? 'bg-red-50 text-red-800' :
                        notif.type === 'email' ? 'bg-blue-50 text-blue-800' :
                        'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === 'success' && <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />}
                        {notif.type === 'error' && <XCircle size={16} className="mt-0.5 flex-shrink-0" />}
                        {notif.type === 'email' && <Mail size={16} className="mt-0.5 flex-shrink-0" />}
                        {notif.type === 'info' && <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p>{notif.message}</p>
                          <p className="text-xs opacity-75 mt-1">{notif.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Workshops List */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {workshops.map(workshop => (
                <div key={workshop.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{workshop.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {workshop.date} at {workshop.time}
                        </span>
                        <span className={`font-medium ${
                          workshop.registered.length >= workshop.capacity 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {workshop.registered.length}/{workshop.capacity} spots filled
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => sendReminders(workshop.id)}
                      disabled={workshop.registered.length === 0}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Reminders
                    </button>
                  </div>

                  {/* Registered Students */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Registered Students</h4>
                    {workshop.registered.length === 0 ? (
                      <p className="text-gray-500 text-sm">No students registered yet</p>
                    ) : (
                      <div className="space-y-2">
                        {workshop.registered.map((student, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded">
                            <div>
                              <p className="font-medium text-gray-800">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                            <button
                              onClick={() => cancelRegistration(workshop.id, student.email)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Waitlist */}
                  {workshop.waitlist.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Waitlist ({workshop.waitlist.length})
                      </h4>
                      <div className="space-y-2">
                        {workshop.waitlist.map((student, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-yellow-50 p-3 rounded">
                            <div>
                              <p className="font-medium text-gray-800">
                                #{idx + 1} {student.name}
                              </p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                            <button
                              onClick={() => removeFromWaitlist(workshop.id, student.email)}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopCapacitySystem;
