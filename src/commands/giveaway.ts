import { Command, CommandParams } from "../utils/structs";

export default class GiveawayCommand extends Command {
  name = "giveaway";
  desc = "Pour gérer les giveaways";
  usage = "gw <create/end/infos>";
  categorie: string;
  
  async execute(args: CommandParams): Promise<void> {
    
  }
}