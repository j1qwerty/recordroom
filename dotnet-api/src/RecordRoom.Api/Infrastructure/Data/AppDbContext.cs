using Microsoft.EntityFrameworkCore;
using RecordRoom.Api.Domain;

namespace RecordRoom.Api.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<LoginHistoryEntry> LoginHistory => Set<LoginHistoryEntry>();

    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<StorageUnit> StorageUnits => Set<StorageUnit>();
    public DbSet<Shelf> Shelves => Set<Shelf>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<LayoutRevision> LayoutRevisions => Set<LayoutRevision>();

    public DbSet<RecordFile> Files => Set<RecordFile>();
    public DbSet<IssueReceipt> Issues => Set<IssueReceipt>();
    public DbSet<IssueLine> IssueLines => Set<IssueLine>();
    public DbSet<MovementEvent> Movements => Set<MovementEvent>();
    public DbSet<AuditEntry> Audit => Set<AuditEntry>();

    public DbSet<DigitizationBatch> Batches => Set<DigitizationBatch>();
    public DbSet<DigitizationPage> Pages => Set<DigitizationPage>();
    public DbSet<MapUpload> Maps => Set<MapUpload>();
    public DbSet<BulkImportJob> BulkJobs => Set<BulkImportJob>();
    public DbSet<BulkImportRow> BulkRows => Set<BulkImportRow>();
    public DbSet<BarcodeJob> BarcodeJobs => Set<BarcodeJob>();

    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<MediaLink> MediaLinks => Set<MediaLink>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // ---------------------------------------------------------------- identity
        b.Entity<AppUser>(e =>
        {
            e.ToTable("Users");
            e.HasIndex(x => x.UserName).IsUnique();
            e.HasOne(x => x.Employee).WithMany(x => x.Users).HasForeignKey(x => x.EmployeeCode)
                .HasPrincipalKey(x => x.EmployeeCode).OnDelete(DeleteBehavior.NoAction);
            e.Property(x => x.UserName).HasMaxLength(64);
        });

        b.Entity<Employee>(e =>
        {
            e.ToTable("Employees");
            e.HasIndex(x => x.EmployeeCode).IsUnique();
            e.Property(x => x.EmployeeCode).HasMaxLength(32);
        });

        b.Entity<LoginHistoryEntry>(e =>
        {
            e.ToTable("LoginHistory");
            e.HasIndex(x => x.LoginAt);
        });

        // --------------------------------------------------------------- location
        b.Entity<Room>(e =>
        {
            e.ToTable("Rooms");
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(32);
        });

        b.Entity<Section>(e =>
        {
            e.ToTable("Sections");
            e.HasIndex(x => new { x.RoomId, x.Name }).IsUnique();
            e.Property(x => x.Code).HasMaxLength(64);
            e.HasOne(x => x.Room).WithMany(x => x.Sections).HasForeignKey(x => x.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<StorageUnit>(e =>
        {
            e.ToTable("StorageUnits");
            e.HasIndex(x => new { x.RoomId, x.Code }).IsUnique();
            e.HasIndex(x => x.Barcode).IsUnique();
            e.Property(x => x.Code).HasMaxLength(32);
            e.Property(x => x.Barcode).HasMaxLength(64);
            // Layout coordinates are percentages; without an explicit precision
            // SQL Server silently truncates them.
            e.Property(x => x.X).HasPrecision(6, 2);
            e.Property(x => x.Y).HasPrecision(6, 2);
            e.Property(x => x.Width).HasPrecision(6, 2);
            e.Property(x => x.Height).HasPrecision(6, 2);
            e.HasOne(x => x.Room).WithMany(x => x.StorageUnits).HasForeignKey(x => x.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Section).WithMany(x => x.StorageUnits).HasForeignKey(x => x.SectionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Shelf>(e =>
        {
            e.ToTable("Shelves");
            e.HasIndex(x => x.Barcode).IsUnique();
            e.Property(x => x.Barcode).HasMaxLength(64);
            e.Property(x => x.Code).HasMaxLength(64);
            e.HasOne(x => x.StorageUnit).WithMany(x => x.Shelves).HasForeignKey(x => x.StorageUnitId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Area>(e =>
        {
            e.ToTable("Areas");
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<LayoutRevision>(e =>
        {
            e.ToTable("LayoutRevisions");
            e.HasIndex(x => new { x.RoomId, x.Revision }).IsUnique();
            e.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Cascade);
        });

        // ----------------------------------------------------------------- files
        b.Entity<RecordFile>(e =>
        {
            e.ToTable("Files");
            // The legacy UNIQUE KEY on file_barcode.
            e.HasIndex(x => x.Barcode).IsUnique();
            e.HasIndex(x => new { x.Department, x.Status });
            e.HasIndex(x => x.ShelfId);
            e.Property(x => x.Barcode).HasMaxLength(64);
            e.Property(x => x.FileNumber).HasMaxLength(64);
            e.Property(x => x.Subject).HasMaxLength(400);
            e.Property(x => x.RecordKind).HasMaxLength(8);
            e.Property(x => x.DocumentSize).HasMaxLength(16);
            e.Property(x => x.EOfficeReference).HasMaxLength(200);
            e.Property(x => x.LocationDisplay).HasMaxLength(300);
            e.HasOne(x => x.Shelf).WithMany(x => x.Files).HasForeignKey(x => x.ShelfId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<IssueReceipt>(e =>
        {
            e.ToTable("IssueReceipts");
            e.HasIndex(x => x.ReceiptNumber).IsUnique();
            e.HasIndex(x => x.Status);
            e.Property(x => x.ReceiptNumber).HasMaxLength(32);
            e.HasMany(x => x.Lines).WithOne(x => x.IssueReceipt!).HasForeignKey(x => x.IssueReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<IssueLine>(e =>
        {
            e.ToTable("IssueLines");
            e.HasIndex(x => new { x.IssueReceiptId, x.RecordFileId }).IsUnique();
            e.HasOne(x => x.RecordFile).WithMany(x => x.IssueLines).HasForeignKey(x => x.RecordFileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<MovementEvent>(e =>
        {
            e.ToTable("Movements");
            e.HasIndex(x => x.At);
            e.HasIndex(x => x.RecordFileId);
        });

        b.Entity<AuditEntry>(e =>
        {
            e.ToTable("AuditLog");
            e.HasIndex(x => x.At);
            e.HasIndex(x => x.Entity);
            e.Property(x => x.Entity).HasMaxLength(64);
        });

        // ---------------------------------------------------------- digitization
        b.Entity<DigitizationBatch>(e =>
        {
            e.ToTable("DigitizationBatches");
            e.HasIndex(x => x.Code).IsUnique();
            // One open batch per employee and folder.
            e.HasIndex(x => new { x.EmployeeCode, x.Folder, x.Status });
            e.HasOne(x => x.Employee).WithMany(x => x.Batches).HasForeignKey(x => x.EmployeeCode)
                .HasPrincipalKey(x => x.EmployeeCode).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Pages).WithOne(x => x.Batch!).HasForeignKey(x => x.BatchId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<DigitizationPage>(e =>
        {
            e.ToTable("DigitizationPages");
            e.HasIndex(x => new { x.Barcode, x.PageNo, x.Version }).IsUnique();
            e.HasOne(x => x.RecordFile).WithMany(x => x.Pages).HasForeignKey(x => x.Barcode)
                .HasPrincipalKey(x => x.Barcode).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<MapUpload>(e =>
        {
            e.ToTable("MapUploads");
            e.HasIndex(x => new { x.Barcode, x.PageNo, x.Version }).IsUnique();
            e.HasOne(x => x.RecordFile).WithMany(x => x.Maps).HasForeignKey(x => x.Barcode)
                .HasPrincipalKey(x => x.Barcode).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<BulkImportJob>(e =>
        {
            e.ToTable("BulkImportJobs");
            e.HasMany(x => x.Rows).WithOne(x => x.Job!).HasForeignKey(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<BulkImportRow>(e =>
        {
            e.ToTable("BulkImportRows");
            e.HasIndex(x => x.JobId);
        });

        b.Entity<BarcodeJob>(e =>
        {
            e.ToTable("BarcodeJobs");
            e.Property(x => x.TargetId).HasMaxLength(64);
            e.Property(x => x.Value).HasMaxLength(200);
        });

        b.Entity<Inquiry>(e => e.ToTable("Inquiries"));
        b.Entity<MediaLink>(e =>
        {
            e.ToTable("MediaLinks");
            e.Property(x => x.Url).HasMaxLength(1000);
        });
    }
}