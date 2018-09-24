# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 3

# Instructions

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. In 'server_dev' run the command `npm start` to start the local database (in 'server_dev' folder consult README.md for dependencies and setup for running the local database)

3. With your server running, visit the site: `http://localhost:8000`

# Purpose

The final stage of the project adds the following enhancements:
* Adds a form to allow users to create their own reviews: In previous versions of the application, users could only read reviews from the database. The form should include the user’s name, the restaurant id, the user’s rating, and whatever comments they have. Submitting the form should update the server when the user is online.

* Adds functionality to defer updates until the user is connected: If the user is not online, the app notifies the user that they are not connected, and saves the users' data to submit automatically when re-connected. The review will be deferred and sent to the server when connection is re-established.

* Meets performance requirements:
  * Progressive Web App score >= 90.
  * Performance score >= 90.
  * Accessibility score >= 90.
