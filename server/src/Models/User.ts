import { Visitor } from "./Visitor";
import { Serializable } from "../Serializer/Serializable";
import { Reader } from "../Serializer/Reader";
import { Writer } from "../Serializer/Writer";
import { Email } from "../ValueTypes/Email";
import { UserStatus, UserStatusEnum } from "../Utils/UserStatus";

export class User extends Visitor implements Serializable {
  protected id: number;
  protected name: string | null = null;
  protected githubUsername: string | null = null;
  protected email: Email | null = null;
  protected status: UserStatus = new UserStatus();
  protected role: string = "USER"; // @todo: remove and set UserRole
  protected password: string | null = null;
  protected resetPasswordToken: string | null = null;
  protected resetPasswordExpire: number | null = null;
  protected confirmEmailToken: string | null = null;
  protected confirmEmailExpire: number | null = null;
  
  /** Do not call this constructor directly. Instead use the SerializableFactory
   *  appropriate for your backend!
   *  example:
   *    const dsf = new DatabaseSerializableFactory(db); 
   *    u: User = dsf.create("User");
   */
  constructor(id: number) {
    super();
    this.id = id;
  }

  readFrom(reader: Reader): void {
    this.id = reader.readNumber("id") as number;
    this.name = reader.readString("name");
    this.githubUsername = reader.readString("githubUsername");
    const emailString = reader.readString("email");
    if (emailString != null) {
      this.email = new Email(emailString);
    } else {
      this.email = null;
    }
    this.status = this.status.transitionTo(reader.readString("status") as UserStatusEnum);
    this.role = reader.readString("userRole") as string;
    this.password = reader.readString("password");
    this.resetPasswordToken = reader.readString("resetPasswordToken");
    this.resetPasswordExpire = reader.readNumber("resetPasswordExpire");
    this.confirmEmailToken = reader.readString("confirmEmailToken");
    this.confirmEmailExpire = reader.readNumber("confirmEmailExpire");
  }

  writeTo(writer: Writer): void {
    writer.writeNumber("id", this.id);
    writer.writeString("name", this.name);
    writer.writeString("githubUsername", this.githubUsername);
    if (this.email === null) {
      writer.writeString("email", null);
    } else {
      writer.writeString("email", this.email.toString());
    }
    writer.writeString("status", this.status.getStatusString());
    writer.writeString("userRole", this.role);
    writer.writeString("password", this.password);
    writer.writeString("resetPasswordToken", this.resetPasswordToken);
    writer.writeNumber("resetPasswordExpire", this.resetPasswordExpire);
    writer.writeString("confirmEmailToken", this.confirmEmailToken);
    writer.writeNumber("confirmEmailExpire", this.confirmEmailExpire);
  }

  // Getters
  public getId(): number | undefined{
    return this.id;
  }

  public getName(): string | null {
    return this.name;
  }

  public getGithubUsername(): string | null {
    return this.githubUsername;
  }

  public getEmailString(): string | null {
    if (this.email === null) {
      return null;
    }
    return this.email.toString();
  }

  public getEmail(): Email | null {
    return this.email;
  }

  public getStatus(): string {
    return this.status.getStatusString();
  }

  public getRole(): string {
    return this.role;
  }

  public getPassword(): string | null{
    return this.password;
  }

  public getResetPasswordToken(): string | null{
    return this.resetPasswordToken;
  }

  public getResetPasswordExpire(): number | null {
    return this.resetPasswordExpire;
  }

  public getConfirmEmailToken(): string | null {
    return this.confirmEmailToken;
  }

  public getConfirmEmailExpire(): number | null {
    return this.confirmEmailExpire;
  }

  // Setters
  public setName(name: string | null){
    this.name = name;
  }

  public setGithubUsername(githubUsername: string | null){
    this.githubUsername = githubUsername;
  }

  public setEmail(email: Email | null){
    this.email = email;
  }

  public setStatus(status: string) {
    this.status = this.status.transitionTo(status as UserStatusEnum);
  }

  public setRole(role: string){
    this.role = role;
  }

  public setPassword(password: string | null){
    this.password = password;
  }

  public setResetPasswordToken(resetPasswordToken: string | null){
    this.resetPasswordToken = resetPasswordToken;
  }

  public setResetPasswordExpire(resetPasswordExpire: number | null){
    this.resetPasswordExpire = resetPasswordExpire;
  }

  public setConfirmEmailToken(confirmEmailToken: string | null){
    this.confirmEmailToken = confirmEmailToken;
  }

  public setConfirmEmailExpire(confirmEmailExpire: number | null){
    this.confirmEmailExpire = confirmEmailExpire;
  }
}