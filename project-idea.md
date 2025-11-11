License keys: Generation, delivery and management

Story
During sales conversations for our Business (aka Enterprise) and Embed plans, the lead requests to try out Activepieces, either on the cloud or self hosted and in some cases, both. We’d like to deliver the keys quickly and track their activation for later.
Goals
Key generationa

Our sales team needs to generate a new license very quickly and specify the followings:

Customer email
Enabled features:
Presets: These will auto select the features in the form UI, but the features can still be changed on the UI.
None: Deselects all features.
All: Selects all features.
Business: Selects all features but the Embed SDK.
Embed: Selects Embed SDK, Templates, Pieces Management.

Features list: Checkboxes for all features that get selected by the presets

Valid for: Number of days, defaults to 14.
Deployment: Cloud or self hosted.

Key delivery

On trial:

We need to streamline how we deliver the keys to the customer. Once the Key Generation form is submitted (or a button in the keys table), an email will be sent to the customer’s email.

Subject: “Your Activepieces [cloud / self-hosted] license key is here”

The email will contain 1 trial key and the instructions to activate it for both cloud and self hosted.

We must be able to send this email without asking the customer to do anything before (like creating an account on Activepieces or so).


When the deal is closed:

Once the deal is closed, we’ll send a new email with 2 keys (the old trial key is now a development key, and a new production key), with instructions to activate them either on the cloud or self hosted.


Key management

Our team needs to see a table of all keys with the ability to find the key of one customer (email or part of the email, like the domain name), and the table has to show the main information: Email, Creation Date, Activation Date, Expiry Date, Plan (it will be great if we can map out the features to the presets we have).

We need the following actions for each key (if the action is valid):

Extend Key: Allows the team to add more trial days, defaults to 7.

Deal Closed:
Removes the key expiry
Asks for the bought limits (in our new pricing, the limit is on Active Flows).
Sends a welcome email to the customer, with the limits and features they bought.

Disable Key: Deactivates the key.
