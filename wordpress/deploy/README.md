# Nikabana hosting deployment

Production branch: `wordpress`. `main` preserves the original Next.js site.

On this cPanel account the checkout is `/home/tutivari/repositories/nikabana` and WordPress is `/home/tutivari/public_html`.

cPanel **Git Version Control → Manage → Pull or Deploy → Update from Remote → Deploy HEAD Commit** publishes the current branch. Only `wordpress/themes/mojarrad` and `wordpress/plugins/mojarrad-core` are synchronized. Uploaded media, the private vault, database, users and wp-config.php are preserved. Do not edit those two code directories on hosting; commit code to GitHub instead.

Optional cPanel Cron Jobs (every 5 minutes):

```
/bin/bash /home/tutivari/repositories/nikabana/wordpress/deploy/poll.sh > /home/tutivari/nikabana-deploy.log 2>&1
```

This fetches GitHub over HTTPS, requires a clean checkout, accepts fast-forward updates only and validates PHP before publishing. No token or password is stored. The last deployed commit is recorded privately in `~/.nikabana-release`; a release marker busts browser asset caches. Force-pushed or older history is rejected. Revert with a new Git revert commit on `wordpress`, then push; never reset production backwards.

After activation, schema upgrades remain the responsibility of Mojarrad Core's existing version migration code. Demo fixtures are excluded from deployment.
