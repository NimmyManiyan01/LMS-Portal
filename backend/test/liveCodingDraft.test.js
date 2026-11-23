const {test}=require("node:test");
const assert=require("node:assert/strict");
const Answer=require("../src/models/Answer");
const Attempt=require("../src/models/Attempt");
const IntegrityEvent=require("../src/models/IntegrityEvent");
const mongoose=require("mongoose");
const adminRouter=require("../src/routes/adminRoutes");
const codingRouter=require("../src/routes/codingRoutes");

function handler(router,method,path){
 return router.stack.find(({route})=>route?.path===path&&route.methods[method]).route.stack.at(-1).handle;
}
test("draft save stores editing fields without grading or modifying submitted code",async t=>{
 const attemptId=new mongoose.Types.ObjectId(),studentId=new mongoose.Types.ObjectId(),questionId=new mongoose.Types.ObjectId();
 t.mock.method(Attempt,"findOne",query=>({async lean(){
  assert.equal(String(query.studentId),String(studentId));
  assert.equal(query.status,"IN_PROGRESS");
  assert.ok(query.expiresAt.$gt instanceof Date);
  return {_id:attemptId,assignedQuestionIds:[questionId]};
 }}));
 let saved;
 t.mock.method(Answer,"findOneAndUpdate",async (filter,changes)=>{
  assert.equal(String(filter.questionId),String(questionId));saved=changes.$set;return {savedAt:saved.savedAt};
 });
 let result;
 await handler(codingRouter,"put","/attempts/:id/draft")({params:{id:String(attemptId)},student:{_id:studentId},body:{questionId:String(questionId),code:"return 1",language:"javascript"}},{json(body){result=body}});
 assert.equal(result.saved,true);
 assert.deepEqual(Object.keys(saved).sort(),["draftCode","draftLanguage","savedAt"]);
});
test("live monitoring counts draft work separately from graded submission",async t=>{
 const id=new mongoose.Types.ObjectId();
 t.mock.method(Attempt,"find",()=>({populate(){return this},sort(){return this},async lean(){return [{_id:id,status:"IN_PROGRESS",examId:{title:"Coding"},studentId:{studentId:"Test"},assignedQuestionIds:[id]}]}}));
 t.mock.method(IntegrityEvent,"find",()=>({sort(){return this},async lean(){return []}}));
 t.mock.method(Answer,"find",()=>({async lean(){return [{attemptId:id,draftCode:"test",totalTestCases:0,passCount:0,score:0,savedAt:new Date()}]}}));
 let result;
 await handler(adminRouter,"get","/monitoring/attempts")({query:{}},{set(){return this},json(body){result=body}});
 assert.equal(result.attempts[0].attemptedCount,1);
 assert.equal(result.attempts[0].submittedCount,0);
 assert.equal(result.attempts[0].lastExecutionStatus,"IN_PROGRESS");
});
