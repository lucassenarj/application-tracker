# Application tracker

## Overview
Project that give to you a application manager for jobs applications.

You can store an application
    - User should provide the details of the application, like:
        - Title (name)
        - Description
        - Company (name)
        - Contact person (name, email, position)
        - Application status (interview, waiting, rejected, etc)
        - And others

The application should have an page that list the application with filters available
    - When user click in an application, should display page with the details of the application
    - User can update status
        - Select box that with status available
        - Display status in logical order (since application until possibles feedbacks like rejection and job offer)
        - When selected status, should open a modal with asking user for more information
            - Should have a text area for user provide more information
            - Data to recruter is optional
            - Date
            - Text area for extra informations

Project should have a dashboard with statistics about the applications,
    - Application total
    - Total rejections
    - Total Offers
    - Total inverviews (technical and non-technical)

Users should be possible to use application without an login, however, the data will only persists after registration

If user is logged, see a profile page

## Technologies
### Overview
- Project to studies porpouses, so may contain overengineered.
- The goal is learn how to work using IA as an assistant
- Learn architecture and design pattern pricipes

### Frontend
**TO DO:**
- Search for best strategy for the FE
- Use or not framework
- Which framework to use and why
- How to handle with css
- How to handle with optimization
- How to handle with deploy

### Backend
**TO DO:**
- Microservices architecture (think about how)
- Gateway that receive frontend requests and forward to the correct service

#### Gateway
**TO DO:**
- Search for why implementing a gateway service
    - Keys points
    - Best practices
    - Technologies
    - Frameworks
    - Use GraphQL (?)

#### Service
**TO DO:**
- Search for what kind of service an application of that type can have
    - What is the goal of each service
    - The prons and coins of each service
    - Best practices for services internal communications protocols 
    - Storage strategies

- Create a service using go lang
    - Overview why
    - Architecture
    - Goals
    - Constrains
    - Design Patterns

### Infrastructure
**TO DO:**
- Search how to create a microservice infrastructure 
- Use docker container or any other orchestrator (?)
- Local infrastructure should user custom domains

### Deploy
**TO DO:**
- Search for deploy strategies
- Where to deploy
- How to deploy
- How to optimize FE
- How to optimize BE

### Observation
**TO DO:**
- Search for observation strategies
- Why to use
- What to use
- How to use

