 NBA Player Performance Predictor

 Project Description  
A website that predicts how many points an NBA player will score in their next game using machine 
learning. Users search for any player, view their recent game stats, and get instant predictions 
based on their performance trends. The site uses React for the frontend, Python/Flask for the 
backend API, and a Linear Regression model trained on 2023-24 NBA season data.


Tech stack:

-Frontend: React.js, Tailwind CSS, Chart.js

-Backend: Python, Flask, PostgreSQL

-Machine Learning: scikit-learn, pandas, numpy

-Deployment: Vercel (Frontend), Render (Backend), Supabase (Database)


Features


-Feature 1: Player Search Page

The homepage has a search bar where users type a player's name and see matching results in
dropdown. Clicking a player takes you to their stats page showing the last 10 games in a table and
a line graph of their scoring trend. The page is styled with Tailwind CSS and works on desktop and
mobile devices.


-Feature 2:Prediction Engine 

The backend grabs a player's last 5 games from the database, calculates the average points, and 
feeds it into a Linear Regression model trained on 2023-24 NBA data. The model predicts how many 
points the player will score in their next game and returns it to the front end with a confidence 
score. The trained model is loaded once when the Flask server starts, making predictions instant.

-Feature 3: Backend API Server

The backend is a Python Flask server that connects the website to the database. When users search 
for a player or view stats, the React frontend sends requests to the Flask server, which then gets 
the data from PostgreSQL and sends it back. The server also loads the ML model and uses it to 
generate predictions when requested.



1. Backend Setup

-bashcd backend

-pip install -r requirements.txt

-python app.py

-Backend runs at http://localhost:5000

3. Frontend Setup

-bashcd frontend

-npm install

-npm start

-Website opens at http://localhost:3000


3) Database Setup

-Go to supabase.com and sign up

-Create a new project

-Copy your connection string

-Add it to backend/.env



Team Members


Person 1 - Frontend (React)

Person 2 - Backend (Flask/Database)

Person 3 - Machine Learning

Person 4 - Deployment/Documentation


License
 MIT

