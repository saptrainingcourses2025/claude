based on our current user jwt strategy, please implement following changes to service layer files @anubhav-claude/srv/cat-service.cds amd @anubhav-claude/srv/user-management.cds 
1. apply the jwt auth to catalog service and make sure user access only their own data, however admin can access all the data of all entities
2. The user-management service is only accessed by users for which ADMIN  role is assigned
3. Create http calls in a new role-tester.http file for query a admin user, create jwt for admin and test call for catalog service (not more than 5) also calls for a user, obtain jwt and call for catalog serice. Additionally create call for admin for testing user management
4. Write a init script which check if ADMIN, AGENT, TRAVELLER role exist in ROLE table, if not create them in DB
5. Also write a user_init script to create a default admin user anubhav@anubhavtrainings.com with password as Welcome1!
6. Run the init scripts on startup as middleware of cap application so it can create role and admin user when we deploy app first time