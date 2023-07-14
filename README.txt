Release procedure


Update VykingMixinVersion in vyking.ts in package.json
Run: npm run build

git add and commit whats checked out.
get checkout -b <release-VERSION>
Run: npm run build
Copy "dist" folder to release folder: ../release/<model-viewer version number>
Rename "dist" to the release version number (eg v3.1.1-1.4)

Deploy to AWS

Login to AWS
TO DO but will probably create a version number folder tree for each release and put model-viewer.min.js in it. will
probably also have a latest version in the directory above. eg "3.1.1/1.4/model-viewer.min.js" and appropriate latests version
at each point in the tree.

Upgrade appropriate examples.

Commit new release to git

When on release branch:
git tag -a "v<release number>" -m "<release note>" defines a tag for that release.
git checkout master
git merge <release branch>
git push
git push origin <tag name> pushes the tag onto the remote origin.
git checkout dev
git merge master (Should say Already up to date.)


Notes

Need to sync with Google's upstream model-viewer regularly.