# Application tracker

## Overview
Project that gives you an application manager for job applications.

You can store an application
    - User should provide the details of the application, like:
        - Title (name)
        - Description
        - Company (name)
        - Contact person (name, email, position)
        - Application status (interview, waiting, rejected, etc)
        - And others

The application should have a page that lists the applications with filters available
    - When the user clicks on an application, it should display a page with the details of the application
    - User can update status
        - Select box with the available statuses
        - Display statuses in logical order (from application until possible feedback like rejection and job offer)
        - When a status is selected, it should open a modal asking the user for more information
            - Should have a text area for the user to provide more information
            - Recruiter information is optional
            - Date
            - Text area for extra information

Project should have a dashboard with statistics about the applications,
    - Application total
    - Total rejections
    - Total Offers
    - Total interviews (technical and non-technical)

Users should be able to use the application without logging in, however, the data will only persist after registration

If the user is logged in, they can see a profile page

## Technologies
### Overview
- Project for study purposes, so it may contain overengineering.
- The goal is to learn how to work using AI as an assistant
- Learn architecture and design pattern principles

### Frontend
**TO DO:**
- Search for best strategy for the FE
- Use or not framework
- Which framework to use and why
- How to handle CSS
- How to handle optimization
- How to handle deployment

### Backend
**TO DO:**
- Microservices architecture (think about how)
- Gateway that receives frontend requests and forwards them to the correct service

#### Gateway
**TO DO:**
- Search for why implementing a gateway service
    - Key points
    - Best practices
    - Technologies
    - Frameworks
    - Use GraphQL (?)

#### Service
**TO DO:**
- Search for what kind of service an application of that type can have
    - What is the goal of each service
    - The pros and cons of each service
    - Best practices for services' internal communication protocols
    - Storage strategies

- Create a service using Go
    - Overview why
    - Architecture
    - Goals
    - Constraints
    - Design Patterns

### Infrastructure
**TO DO:**
- Search how to create a microservice infrastructure
- Use docker container or any other orchestrator (?)
- Local infrastructure should use custom domains

### Deploy
**TO DO:**
- Search for deploy strategies
- Where to deploy
- How to deploy
- How to optimize FE
- How to optimize BE

### Observability
**TO DO:**
- Search for observability strategies
- Why to use
- What to use
- How to use
